import pg from "pg";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split("\n")
    .filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => [l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()])
);

const REF = "uchpyzcpifdwcbddxhfc";
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;

// Supabase session-mode pooler accepts service role key as password
const CONN_STRINGS = [
  `postgresql://postgres.${REF}:${KEY}@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${REF}:${KEY}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres:${KEY}@db.${REF}.supabase.co:5432/postgres`,
];

const SQL = `
DROP INDEX IF EXISTS chunks_embedding_idx;

CREATE INDEX IF NOT EXISTS chunks_embedding_hnsw_idx
  ON chunks USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(512),
  match_workspace_id uuid,
  match_count int default 20,
  match_threshold float default 0.3
)
RETURNS TABLE (id uuid, document_id uuid, content text, chunk_index int, similarity float)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT c.id, c.document_id, c.content, c.chunk_index,
         1 - (c.embedding <=> query_embedding) AS similarity
  FROM chunks c
  WHERE c.workspace_id = match_workspace_id
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;

SELECT 'migration complete' AS result;
`;

const { default: { Client } } = await import("pg");

for (const connStr of CONN_STRINGS) {
  const host = connStr.match(/@([^:]+):/)?.[1] ?? "?";
  console.log(`Trying ${host}...`);
  const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
  try {
    await client.connect();
    const res = await client.query(SQL);
    console.log("✓ Migration succeeded:", res.rows?.[0]?.result ?? "done");
    await client.end();
    process.exit(0);
  } catch (err) {
    console.log("  failed:", err.message?.slice(0, 80));
    await client.end().catch(() => {});
  }
}

console.log("\nAll connection attempts failed. Run the SQL manually in Supabase Dashboard → SQL Editor.");
