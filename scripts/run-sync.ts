// Triggers a Notion sync directly — same logic as POST /api/sync but runs locally
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split("\n")
    .filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => [l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()])
);
Object.assign(process.env, env);

import { createClient } from "@supabase/supabase-js";
import { fetchNotionDocs } from "../lib/sync/fetchers/notion";
import { ingestDocuments } from "../lib/sync/ingest";

const service = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const WORKSPACE_ID = "446a635e-fa0d-469b-a51b-f885ade2e24d";

const { data: source } = await service
  .from("sources")
  .select("id, metadata")
  .eq("workspace_id", WORKSPACE_ID)
  .eq("provider", "notion")
  .single();

if (!source?.metadata?.access_token) {
  console.error("No Notion token found");
  process.exit(1);
}

console.log("Syncing Notion...");
await service.from("sources").update({ status: "syncing" }).eq("id", source.id);

try {
  const docs = await fetchNotionDocs(source.metadata.access_token);
  console.log(`Fetched ${docs.length} docs`);

  // Show author extraction results
  const withAuthor = docs.filter(d => d.author);
  console.log(`Authors populated: ${withAuthor.length}/${docs.length}`);
  withAuthor.slice(0, 5).forEach(d => console.log(`  "${d.title}" → author: ${d.author}`));

  await ingestDocuments(WORKSPACE_ID, source.id, "notion", docs);

  await service.from("sources").update({
    status: "connected",
    last_synced_at: new Date().toISOString(),
    error_message: null,
    metadata: { ...source.metadata, docs_indexed: docs.length },
  }).eq("id", source.id);

  console.log(`\nSync complete — ${docs.length} docs indexed`);
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("Sync failed:", msg);
  await service.from("sources").update({ status: "error", error_message: msg }).eq("id", source.id);
}
