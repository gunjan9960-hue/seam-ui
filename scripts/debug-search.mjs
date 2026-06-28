// @ts-check
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()])
);

const SERVICE = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const WORKSPACE_ID = "446a635e-fa0d-469b-a51b-f885ade2e24d";

// 1. Check chunks exist and sample their content
console.log("=== 1. CHUNK SAMPLE ===");
const { data: chunks, count: cc } = await SERVICE
  .from("chunks")
  .select("id, workspace_id, content, chunk_index", { count: "exact" })
  .eq("workspace_id", WORKSPACE_ID)
  .limit(5);
console.log("Chunks in workspace:", cc);
chunks?.forEach((c) => console.log(`  [${c.chunk_index}] ${c.content?.slice(0, 100)}`));

// 2. Check embedding dimensions
console.log("\n=== 2. EMBEDDING DIMENSIONS ===");
const { data: embSample } = await SERVICE
  .from("chunks")
  .select("embedding")
  .eq("workspace_id", WORKSPACE_ID)
  .limit(1);
if (embSample?.[0]?.embedding) {
  const emb = embSample[0].embedding;
  const dims = Array.isArray(emb) ? emb.length : JSON.parse(emb).length;
  console.log("Embedding dimensions:", dims);
} else {
  console.log("WARNING: No embedding found or embedding is null!");
}

// 3. Test match_chunks RPC with a real embedding from Voyage AI
console.log("\n=== 3. VOYAGE EMBED + match_chunks TEST ===");
const VOYAGE_KEY = env.VOYAGE_API_KEY;
if (!VOYAGE_KEY) {
  console.log("ERROR: No VOYAGE_API_KEY in .env.local");
  process.exit(1);
}

const testQuery = "When was Apex founded?";
const voyageRes = await fetch("https://api.voyageai.com/v1/embeddings", {
  method: "POST",
  headers: { "Authorization": `Bearer ${VOYAGE_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({ input: [testQuery], model: "voyage-3-lite" }),
});
const voyageData = await voyageRes.json();
const queryEmbedding = voyageData.data?.[0]?.embedding;
console.log("Query embedding dims:", queryEmbedding?.length);

if (!queryEmbedding) {
  console.log("ERROR: Voyage AI failed:", JSON.stringify(voyageData));
  process.exit(1);
}

// Test at very low threshold to see what similarity scores look like
const { data: rpcResults, error: rpcErr } = await SERVICE.rpc("match_chunks", {
  query_embedding: queryEmbedding,
  match_workspace_id: WORKSPACE_ID,
  match_count: 10,
  match_threshold: 0.0,   // zero threshold = return everything, so we can see scores
});
console.log("RPC error:", rpcErr?.message ?? "none");
console.log("RPC results at threshold=0:", rpcResults?.length ?? 0);
if (rpcResults?.length) {
  rpcResults.slice(0, 8).forEach((r) => {
    console.log(`  sim=${r.similarity?.toFixed(4)} | ${r.content?.slice(0, 80)}`);
  });
}

// 4. Test at threshold=0.45 (what the prod code uses)
console.log("\n=== 4. AT THRESHOLD 0.45 ===");
const { data: rpc45 } = await SERVICE.rpc("match_chunks", {
  query_embedding: queryEmbedding,
  match_workspace_id: WORKSPACE_ID,
  match_count: 10,
  match_threshold: 0.45,
});
console.log("Results at 0.45:", rpc45?.length ?? 0);

// 5. Also test the Notion token for MCP connectivity
console.log("\n=== 5. NOTION TOKEN STATUS ===");
const { data: source } = await SERVICE.from("sources")
  .select("metadata,status")
  .eq("workspace_id", WORKSPACE_ID)
  .eq("provider", "notion")
  .single();
const token = source?.metadata?.access_token;
console.log("Source status:", source?.status);
console.log("Token prefix:", token?.slice(0, 20));
const notionTest = await fetch("https://api.notion.com/v1/search", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query: "Apex", page_size: 3 }),
});
const notionData = await notionTest.json();
console.log("Notion search HTTP status:", notionTest.status);
console.log("Notion results:", notionData.results?.length ?? 0, notionData.message ?? "");
