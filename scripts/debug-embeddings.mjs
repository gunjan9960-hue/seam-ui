import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split("\n")
    .filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => [l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()])
);

const S = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const WS = "446a635e-fa0d-469b-a51b-f885ade2e24d";

// 1. Check if embedding column is null or has data
const { data: sample } = await S.from("chunks")
  .select("id, embedding, content")
  .eq("workspace_id", WS)
  .limit(3);

console.log("=== EMBEDDING SAMPLE ===");
sample?.forEach((c, i) => {
  const emb = c.embedding;
  const isNull = emb === null || emb === undefined;
  const type = typeof emb;
  let len = "?";
  if (Array.isArray(emb)) len = emb.length;
  else if (typeof emb === "string") { try { len = JSON.parse(emb).length; } catch {} }
  else if (emb && typeof emb === "object") len = Object.keys(emb).length;
  console.log(`[${i}] null=${isNull} type=${type} len=${len} content="${c.content?.slice(0,50)}"`);
});

// 2. Check null embeddings count
const { count: totalCount } = await S.from("chunks").select("id", { count: "exact", head: true }).eq("workspace_id", WS);
const { count: nullCount } = await S.from("chunks").select("id", { count: "exact", head: true }).eq("workspace_id", WS).is("embedding", null);
console.log(`\nTotal chunks: ${totalCount}, Null embeddings: ${nullCount}`);

// 3. Try calling match_chunks with very negative threshold (-1) — should return all
const voyageRes = await fetch("https://api.voyageai.com/v1/embeddings", {
  method: "POST",
  headers: { "Authorization": `Bearer ${env.VOYAGE_API_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({ input: ["Apex Commerce company overview"], model: "voyage-3-lite" }),
});
const { data: [{ embedding: qEmb }] } = await voyageRes.json();

console.log("\n=== RPC TESTS ===");
for (const threshold of [-1.0, -0.5, 0.0, 0.3, 0.45]) {
  const { data, error } = await S.rpc("match_chunks", {
    query_embedding: qEmb,
    match_workspace_id: WS,
    match_count: 5,
    match_threshold: threshold,
  });
  console.log(`threshold=${threshold}: ${data?.length ?? 0} results ${error ? "ERR: " + error.message : ""}`);
  if (data?.length && threshold === -1.0) {
    console.log("  top result sim:", data[0]?.similarity?.toFixed(4), data[0]?.content?.slice(0,60));
  }
}

// 4. Raw SQL via rpc — bypass match_chunks to check operator directly
const { data: rawSQL, error: rawErr } = await S.rpc("debug_chunk_similarity", {
  qemb: qEmb, ws: WS
}).catch(() => ({ data: null, error: { message: "function does not exist" } }));
console.log("\n=== RAW SQL TEST ===");
console.log(rawErr ? "debug function doesn't exist (expected)" : rawSQL);
