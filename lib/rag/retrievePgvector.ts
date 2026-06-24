import { createClient } from "@/lib/supabase/server";
import { VoyageAIClient } from "voyageai";
import type { RetrievedChunk } from "./retrieval";

// Retrieves chunks from pgvector for the authenticated user's workspace
export async function retrieveFromPgvector(
  query: string,
  topK = 5,
): Promise<RetrievedChunk[] | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: userData } = await supabase
      .from("users")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    if (!userData?.workspace_id) return null;

    // Check if workspace has any chunks
    const { count } = await supabase
      .from("chunks")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", userData.workspace_id);

    if (!count || count === 0) return null;

    // Embed the query
    if (!process.env.VOYAGE_API_KEY) throw new Error("Missing env var: VOYAGE_API_KEY");
    const voyage = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });
    const embResult = await voyage.embed({ input: [query], model: "voyage-3-lite" });
    const queryEmbedding = embResult.data?.[0]?.embedding ?? [];
    if (!queryEmbedding.length) return null;

    // Vector similarity search via Supabase RPC
    const { data: chunks } = await supabase.rpc("match_chunks", {
      query_embedding: queryEmbedding,
      match_workspace_id: userData.workspace_id,
      match_count: topK * 3,
      match_threshold: 0.3,
    });

    if (!chunks?.length) return null;

    // Get document metadata for matched chunks
    const docIds = [...new Set(chunks.map((c: { document_id: string }) => c.document_id))];
    const { data: documents } = await supabase
      .from("documents")
      .select("id,title,url,author,provider,last_modified")
      .in("id", docIds);

    const docMap = new Map(documents?.map((d: { id: string; title: string; url: string; author: string; provider: string; last_modified: string }) => [d.id, d]) ?? []);

    return chunks.slice(0, topK).map((c: { id: string; document_id: string; content: string; chunk_index: number; similarity: number }) => {
      const doc = docMap.get(c.document_id);
      return {
        chunk: {
          docId: c.document_id,
          chunkIndex: c.chunk_index,
          text: c.content,
          doc: {
            id: c.document_id,
            source: doc?.provider ?? "notion",
            title: doc?.title ?? "Untitled",
            content: c.content,
            author: doc?.author ?? "",
            date: doc?.last_modified ?? new Date().toISOString(),
            url: doc?.url ?? "",
            type: "page" as const,
          },
        },
        score: c.similarity,
      };
    });
  } catch {
    return null;
  }
}
