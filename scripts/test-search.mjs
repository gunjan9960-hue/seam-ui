// Test the live search API end-to-end
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split("\n")
    .filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => [l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()])
);

const BASE = "https://seam-ui-ebon.vercel.app";

// We need a valid session cookie to call the search API.
// Instead, test the JS-side logic directly.
import { createClient } from "@supabase/supabase-js";
import { VoyageAIClient } from "voyageai";

const S = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const WS = "446a635e-fa0d-469b-a51b-f885ade2e24d";
const voyage = new VoyageAIClient({ apiKey: env.VOYAGE_API_KEY });

function cosineSim(a, b) {
  let dot = 0, nA = 0, nB = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; nA += a[i]*a[i]; nB += b[i]*b[i]; }
  return dot / (Math.sqrt(nA) * Math.sqrt(nB));
}

const queries = [
  "When was Apex Commerce founded?",
  "Who owns the Analytics Dashboard?",
  "What is the FY2026 OKR for revenue?",
  "Why did we decide to build vs buy the notification system?",
];

const { data: allChunks } = await S.from("chunks")
  .select("id, document_id, content, chunk_index, embedding")
  .eq("workspace_id", WS);

const { data: docs } = await S.from("documents")
  .select("id, title, provider")
  .eq("workspace_id", WS);
const docMap = new Map(docs?.map(d => [d.id, d]));

console.log(`Loaded ${allChunks?.length} chunks, ${docs?.length} docs\n`);

for (const query of queries) {
  const result = await voyage.embed({ input: [query], model: "voyage-3-lite" });
  const qEmb = result.data?.[0]?.embedding;

  const ranked = allChunks
    ?.map(c => {
      const emb = typeof c.embedding === "string" ? JSON.parse(c.embedding) : c.embedding;
      return { ...c, sim: cosineSim(emb, qEmb) };
    })
    .filter(c => c.sim > 0.2)
    .sort((a, b) => b.sim - a.sim)
    .slice(0, 3);

  console.log(`Q: "${query}"`);
  if (ranked?.length) {
    ranked.forEach(r => {
      const doc = docMap.get(r.document_id);
      console.log(`  sim=${r.sim.toFixed(3)} [${doc?.title?.slice(0,40)}] ${r.content?.slice(0,80)}`);
    });
  } else {
    console.log("  NO RESULTS");
  }
  console.log();
}
