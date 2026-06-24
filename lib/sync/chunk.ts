// Targets ~512 tokens per chunk. At ~1.3 tokens/word, 400 words ≈ 520 tokens.
const CHUNK_WORDS = 400;
const OVERLAP_WORDS = 50;

export interface RawChunk {
  content: string;
  chunkIndex: number;
  tokenCount: number;
}

export function chunkText(text: string): RawChunk[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: RawChunk[] = [];
  let i = 0;
  let index = 0;

  while (i < words.length) {
    const slice = words.slice(i, i + CHUNK_WORDS).join(" ");
    // Approximate token count: 1 token ≈ 4 characters
    chunks.push({ content: slice, chunkIndex: index++, tokenCount: Math.ceil(slice.length / 4) });
    i += CHUNK_WORDS - OVERLAP_WORDS;
  }

  return chunks;
}
