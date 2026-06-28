import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split("\n")
    .filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => [l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()])
);

const S = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const WS = "446a635e-fa0d-469b-a51b-f885ade2e24d";

// Get query embedding
const qRes = await fetch("https://api.voyageai.com/v1/embeddings", {
  method: "POST",
  headers: { "Authorization": `Bearer ${env.VOYAGE_API_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({ input: ["When was Apex Commerce founded?"], model: "voyage-3-lite" }),
});
const { data: [{ embedding: qEmb }] } = await qRes.json();

// Fetch ALL chunks with their embeddings and compute similarity in JS
const { data: chunks } = await S.from("chunks")
  .select("id, embedding, content, workspace_id, document_id")
  .eq("workspace_id", WS)
  .limit(20);

console.log("=== JS-COMPUTED SIMILARITIES ===");
const withSim = chunks?.map(c => {
  const stored = typeof c.embedding === "string" ? JSON.parse(c.embedding) : c.embedding;
  if (!stored || stored.length !== 512) return { sim: -99, content: c.content?.slice(0,50), dims: stored?.length };
  const dot = stored.reduce((s, v, i) => s + v * qEmb[i], 0);
  const nA = Math.sqrt(stored.reduce((s, v) => s + v*v, 0));
  const nB = Math.sqrt(qEmb.reduce((s, v) => s + v*v, 0));
  return { sim: dot/(nA*nB), content: c.content?.slice(0,60) };
}).sort((a,b) => b.sim - a.sim);

withSim?.forEach(r => console.log(`sim=${r.sim.toFixed(4)} | ${r.content}`));

// Now: try passing embedding as STRING to RPC instead of array
const embStr = JSON.stringify(qEmb);
console.log("\n=== RPC with string embedding ===");
const { data: strResult, error: strErr } = await S.rpc("match_chunks", {
  query_embedding: embStr,
  match_workspace_id: WS,
  match_count: 5,
  match_threshold: 0.0,
});
console.log("Results:", strResult?.length ?? 0, strErr?.message ?? "");

// Check if there's a docs_indexed column vs metadata issue
console.log("\n=== SOURCE METADATA ===");
const { data: src } = await S.from("sources")
  .select("metadata")
  .eq("workspace_id", WS)
  .eq("provider", "notion")
  .single();
console.log("docs_indexed in metadata:", src?.metadata?.docs_indexed);
