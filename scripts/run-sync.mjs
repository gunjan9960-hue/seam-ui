import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { VoyageAIClient } from "voyageai";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split("\n")
    .filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => [l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()])
);

const S = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const WORKSPACE_ID = "446a635e-fa0d-469b-a51b-f885ade2e24d";

// ── 1. Get token ──────────────────────────────────────────────────────────────
const { data: source } = await S.from("sources")
  .select("id, metadata")
  .eq("workspace_id", WORKSPACE_ID)
  .eq("provider", "notion")
  .single();

const token = source?.metadata?.access_token;
if (!token) { console.error("No Notion token"); process.exit(1); }
console.log("Token:", token.slice(0, 20), "...");

await S.from("sources").update({ status: "syncing" }).eq("id", source.id);

// ── 2. Fetch all Notion pages ─────────────────────────────────────────────────
async function notionFetch(path, body) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${token}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

async function extractBlocks(blocks, depth = 0) {
  const lines = [];
  for (const b of blocks) {
    const text = (b[b.type]?.rich_text ?? []).map(t => t.plain_text).join("");
    if (text) lines.push(text);
    if (b.has_children && depth < 3) {
      const child = await notionFetch(`/blocks/${b.id}/children?page_size=100`);
      lines.push(await extractBlocks(child.results ?? [], depth + 1));
    }
  }
  return lines.filter(Boolean).join("\n");
}

function getTitle(page) {
  const props = page.properties ?? {};
  for (const key of ["title", "Title", "Name"]) {
    const t = props[key]?.title;
    if (t?.length) return t.map(r => r.plain_text).join("");
  }
  return "Untitled";
}

function extractAuthor(content) {
  const m = content.match(/\bPM:\s*([^·\n,]+)/);
  return m ? m[1].trim() : "";
}

console.log("\nFetching Notion pages...");
const docs = [];
const seen = new Set();
let cursor;

do {
  const result = await notionFetch("/search", {
    filter: { value: "page", property: "object" },
    page_size: 50,
    ...(cursor ? { start_cursor: cursor } : {}),
  });
  for (const page of result.results ?? []) {
    if (page.object !== "page" || seen.has(page.id)) continue;
    seen.add(page.id);
    const title = getTitle(page);
    const blocks = await notionFetch(`/blocks/${page.id}/children?page_size=100`);
    const content = await extractBlocks(blocks.results ?? []);
    if (!content.trim()) continue;
    docs.push({
      externalId: page.id,
      title,
      url: page.url ?? `https://notion.so/${page.id.replace(/-/g, "")}`,
      author: extractAuthor(content),
      docType: "page",
      content: `${title}\n\n${content}`,
      lastModified: page.last_edited_time ?? new Date().toISOString(),
      provider: "notion",
    });
    process.stdout.write(`  [${docs.length}] ${title.slice(0, 50)}\r`);
  }
  cursor = result.has_more ? result.next_cursor : undefined;
} while (cursor);

console.log(`\nFetched ${docs.length} docs`);

// Author extraction results
const withAuthor = docs.filter(d => d.author);
console.log(`Authors found: ${withAuthor.length}/${docs.length}`);
withAuthor.slice(0, 8).forEach(d => console.log(`  "${d.title.slice(0,40)}" → ${d.author}`));

// ── 3. Chunk + embed + upsert ─────────────────────────────────────────────────
console.log("\nEmbedding and ingesting...");
const voyage = new VoyageAIClient({ apiKey: env.VOYAGE_API_KEY });

function chunkText(text, size = 400, overlap = 80) {
  const words = text.split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += size - overlap) {
    const slice = words.slice(i, i + size).join(" ");
    if (slice.trim()) chunks.push({ content: slice, chunkIndex: chunks.length, tokenCount: slice.split(/\s+/).length });
  }
  return chunks;
}

let ingested = 0;
for (const doc of docs) {
  const hash = Buffer.from(doc.content).toString("base64").slice(0, 64);
  const { data: docRecord, error: docErr } = await S.from("documents").upsert({
    workspace_id: WORKSPACE_ID,
    source_id: source.id,
    provider: "notion",
    external_id: doc.externalId,
    title: doc.title,
    url: doc.url,
    author: doc.author,
    doc_type: doc.docType,
    content_hash: hash,
    last_modified: doc.lastModified,
  }, { onConflict: "workspace_id,provider,external_id" }).select().single();

  if (docErr || !docRecord) continue;

  const chunks = chunkText(doc.content);
  if (!chunks.length) continue;

  const result = await voyage.embed({ input: chunks.map(c => c.content), model: "voyage-3-lite" });
  const embeddings = result.data?.map(d => d.embedding ?? []) ?? [];

  await S.from("chunks").delete().eq("document_id", docRecord.id);
  await S.from("chunks").insert(chunks.map((c, i) => ({
    workspace_id: WORKSPACE_ID,
    document_id: docRecord.id,
    content: c.content,
    embedding: embeddings[i],
    chunk_index: c.chunkIndex,
    token_count: c.tokenCount,
  })));
  ingested++;
  process.stdout.write(`  Ingested ${ingested}/${docs.length}\r`);
}

// ── 4. Update source ──────────────────────────────────────────────────────────
await S.from("sources").update({
  status: "connected",
  last_synced_at: new Date().toISOString(),
  error_message: null,
  metadata: { ...source.metadata, docs_indexed: docs.length },
}).eq("id", source.id);

console.log(`\nSync complete — ${docs.length} docs, ${ingested} ingested`);

// ── 5. Quick search test ──────────────────────────────────────────────────────
console.log("\n=== SEARCH TESTS ===");
const { data: allChunks } = await S.from("chunks").select("id, document_id, content, chunk_index, embedding").eq("workspace_id", WORKSPACE_ID);
const { data: allDocs } = await S.from("documents").select("id, title, author, provider").eq("workspace_id", WORKSPACE_ID);
const docMap = new Map(allDocs?.map(d => [d.id, d]));

function cosineSim(a, b) {
  let dot = 0, nA = 0, nB = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; nA += a[i]*a[i]; nB += b[i]*b[i]; }
  return dot / (Math.sqrt(nA) * Math.sqrt(nB));
}

const queries = [
  "When was Apex founded?",
  "Who owns the Analytics Dashboard?",
  "What is Apex Commerce's FY2026 strategy?",
  "Who are the enterprise customers at risk?",
  "What is the roadmap for the Loyalty product?",
];

for (const q of queries) {
  const emb = await voyage.embed({ input: [q], model: "voyage-3-lite" });
  const qVec = emb.data?.[0]?.embedding;
  const top = allChunks
    ?.map(c => ({ ...c, sim: cosineSim(typeof c.embedding === "string" ? JSON.parse(c.embedding) : c.embedding, qVec) }))
    .filter(c => c.sim > 0.2)
    .sort((a, b) => b.sim - a.sim)
    .slice(0, 2);
  console.log(`\nQ: "${q}"`);
  top?.forEach(r => {
    const d = docMap.get(r.document_id);
    console.log(`  [${r.sim.toFixed(3)}] ${d?.title?.slice(0,45)}${d?.author ? ` (${d.author})` : ""}`);
    console.log(`         ${r.content?.slice(0, 90)}`);
  });
}
