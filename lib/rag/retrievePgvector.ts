import { createClient, createServiceClient } from "@/lib/supabase/server";
import { VoyageAIClient } from "voyageai";
import type { RetrievedChunk } from "./retrieval";

// Cosine similarity computed in JS — used as fallback when the pgvector index
// returns 0 results (IVFFlat with lists=100 and probes=1 misses most vectors
// when the dataset is small; HNSW index fixes this but requires a DB migration).
function cosineSim(a: number[], b: number[]): number {
  let dot = 0, nA = 0, nB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    nA += a[i] * a[i];
    nB += b[i] * b[i];
  }
  return dot / (Math.sqrt(nA) * Math.sqrt(nB));
}

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

    // Embed the query
    if (!process.env.VOYAGE_API_KEY) throw new Error("Missing env var: VOYAGE_API_KEY");
    const voyage = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });
    const embResult = await voyage.embed({ input: [query], model: "voyage-3-lite" });
    const queryEmbedding = embResult.data?.[0]?.embedding ?? [];
    if (!queryEmbedding.length) return null;

    // Try RPC (fast path — works once HNSW index is in place)
    const { data: rpcChunks } = await supabase.rpc("match_chunks", {
      query_embedding: queryEmbedding,
      match_workspace_id: userData.workspace_id,
      match_count: topK * 3,
      match_threshold: 0.2,
    });

    // JS-side fallback: IVFFlat index with lists=100 only scans probes=1 bucket
    // (~2-3 vectors), returning near-zero results on small datasets. Fetch all
    // chunks and rank in JS until an HNSW index is applied via DB migration.
    const serviceClient = createServiceClient();
    const { data: allChunks } = rpcChunks?.length
      ? { data: null }
      : await serviceClient
          .from("chunks")
          .select("id, document_id, content, chunk_index, embedding")
          .eq("workspace_id", userData.workspace_id);

    const THRESHOLD = 0.2;

    let ranked: { id: string; document_id: string; content: string; chunk_index: number; similarity: number }[];

    if (rpcChunks?.length) {
      ranked = rpcChunks;
    } else if (allChunks?.length) {
      ranked = allChunks
        .map((c) => {
          const emb: number[] = typeof c.embedding === "string"
            ? JSON.parse(c.embedding)
            : (c.embedding ?? []);
          if (emb.length !== queryEmbedding.length) return null;
          return { ...c, similarity: cosineSim(emb, queryEmbedding) };
        })
        .filter((c): c is NonNullable<typeof c> => c !== null && c.similarity > THRESHOLD)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK * 3);
    } else {
      return null;
    }

    if (!ranked.length) return null;

    // Get document metadata for matched chunks
    const docIds = [...new Set(ranked.map((c) => c.document_id))];
    const { data: documents } = await supabase
      .from("documents")
      .select("id,title,url,author,provider,last_modified")
      .in("id", docIds);

    const docMap = new Map(documents?.map((d: { id: string; title: string; url: string; author: string; provider: string; last_modified: string }) => [d.id, d]) ?? []);

    return ranked.slice(0, topK).map((c) => {
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
