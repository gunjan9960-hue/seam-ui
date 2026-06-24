import { VoyageAIClient } from "voyageai";

let _client: VoyageAIClient | null = null;

function getClient(): VoyageAIClient {
  if (!process.env.VOYAGE_API_KEY) {
    throw new Error("Missing env var: VOYAGE_API_KEY — document embedding will not work.");
  }
  if (!_client) _client = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });
  return _client;
}

const BATCH_SIZE = 128;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function embedBatchWithRetry(batch: string[]): Promise<number[][]> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await getClient().embed({ input: batch, model: "voyage-3-lite" });
      return result.data?.map((d) => d.embedding ?? []) ?? [];
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
      }
    }
  }
  throw new Error(`Embedding failed after ${MAX_RETRIES} attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const vecs = await embedBatchWithRetry(batch);
    embeddings.push(...vecs);
  }

  return embeddings;
}
