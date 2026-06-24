import { createServiceClient } from "@/lib/supabase/server";
import { chunkText } from "./chunk";
import { embedTexts } from "./embed";

export interface IngestDoc {
  externalId: string;
  title: string;
  url: string;
  author: string;
  docType: string;
  content: string;
  lastModified: string;
  provider: string;
}

export async function ingestDocuments(
  workspaceId: string,
  sourceId: string,
  provider: string,
  docs: IngestDoc[]
) {
  const supabase = createServiceClient();

  for (const doc of docs) {
    const contentHash = Buffer.from(doc.content).toString("base64").slice(0, 64);

    // Upsert document record
    const { data: docRecord, error: docErr } = await supabase
      .from("documents")
      .upsert({
        workspace_id: workspaceId,
        source_id: sourceId,
        provider,
        external_id: doc.externalId,
        title: doc.title,
        url: doc.url,
        author: doc.author,
        doc_type: doc.docType,
        content_hash: contentHash,
        last_modified: doc.lastModified,
      }, { onConflict: "workspace_id,provider,external_id" })
      .select()
      .single();

    if (docErr || !docRecord) continue;

    // Chunk + embed first — if this fails, old chunks are untouched
    const chunks = chunkText(doc.content);
    if (chunks.length === 0) continue;

    const embeddings = await embedTexts(chunks.map((c) => c.content));

    const chunkRows = chunks.map((c, i) => ({
      workspace_id: workspaceId,
      document_id: docRecord.id,
      content: c.content,
      embedding: embeddings[i],
      chunk_index: c.chunkIndex,
      token_count: c.tokenCount,
    }));

    // Only delete old chunks once new embeddings are ready
    await supabase.from("chunks").delete().eq("document_id", docRecord.id);

    const { error: insertErr } = await supabase.from("chunks").insert(chunkRows);
    if (insertErr) throw new Error(`Chunk insert failed: ${insertErr.message}`);
  }
}
