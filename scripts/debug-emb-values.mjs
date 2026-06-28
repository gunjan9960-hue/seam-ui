import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split("\n")
    .filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => [l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()])
);

const S = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const WS = "446a635e-fa0d-469b-a51b-f885ade2e24d";

// Get a stored embedding
const { data: [chunk] } = await S.from("chunks")
  .select("id, embedding, content, chunk_index")
  .eq("workspace_id", WS)
  .limit(1);

const storedEmb = typeof chunk.embedding === "string" ? JSON.parse(chunk.embedding) : chunk.embedding;
console.log("Content:", chunk.content?.slice(0, 80));
console.log("Stored emb first 5 values:", storedEmb?.slice(0, 5));
console.log("Stored emb last 5 values:", storedEmb?.slice(-5));
console.log("Stored emb dims:", storedEmb?.length);

// Get a FRESH embedding for the same content
const voyageRes = await fetch("https://api.voyageai.com/v1/embeddings", {
  method: "POST",
  headers: { "Authorization": `Bearer ${env.VOYAGE_API_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({ input: [chunk.content], model: "voyage-3-lite" }),
});
const { data: [{ embedding: freshEmb }] } = await voyageRes.json();
console.log("\nFresh emb first 5 values:", freshEmb?.slice(0, 5));
console.log("Fresh emb dims:", freshEmb?.length);

// Manually compute cosine similarity between stored and fresh
const dot = storedEmb.reduce((sum, v, i) => sum + v * freshEmb[i], 0);
const normA = Math.sqrt(storedEmb.reduce((s, v) => s + v*v, 0));
const normB = Math.sqrt(freshEmb.reduce((s, v) => s + v*v, 0));
const cosSim = dot / (normA * normB);
console.log("\nManual cosine similarity (stored vs fresh of same content):", cosSim.toFixed(6));
console.log("Expected: ~1.0 if same model; ~0 if completely different");

// Also get a query embedding and compute manually
const qRes = await fetch("https://api.voyageai.com/v1/embeddings", {
  method: "POST",
  headers: { "Authorization": `Bearer ${env.VOYAGE_API_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({ input: ["When was Apex Commerce founded?"], model: "voyage-3-lite" }),
});
const { data: [{ embedding: qEmb }] } = await qRes.json();
const dot2 = storedEmb.reduce((sum, v, i) => sum + v * qEmb[i], 0);
const norm2 = Math.sqrt(qEmb.reduce((s, v) => s + v*v, 0));
const cosSim2 = dot2 / (normA * norm2);
console.log("Manual cosine similarity (stored vs query):", cosSim2.toFixed(6));
