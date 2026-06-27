// ── Shared types ──────────────────────────────────────────────────────────────

export interface SeamDocument {
  id: string;
  source: string;
  title: string;
  content: string;
  author: string;
  date: string;
  url: string;
  type: string;
}

export interface Chunk {
  docId: string;
  chunkIndex: number;
  text: string;
  doc: SeamDocument;
}

export interface RetrievedChunk {
  chunk: Chunk;
  score: number;
}

// ── Stale detection ────────────────────────────────────────────────────────────

const RECENCY_DAYS = 90;

export function allResultsStale(retrieved: RetrievedChunk[]): boolean {
  return retrieved.every((r) => {
    const d = new Date(r.chunk.doc.date);
    if (isNaN(d.getTime())) return true;
    return (Date.now() - d.getTime()) / 86_400_000 > RECENCY_DAYS;
  });
}

// ── Query intent ───────────────────────────────────────────────────────────────

export type QueryIntent =
  | "decision_recall"
  | "spec_lookup"
  | "customer_request"
  | "research_history"
  | "roadmap_rationale"
  | "stakeholder_commitment"
  | "onboarding";

const INTENT_SIGNALS: Record<QueryIntent, string[]> = {
  decision_recall:        ["why","decision","decide","decided","chose","choose","rationale","reason","moved","changed","switched","outage","incident","root cause","corrective","tiered","pricing tiers"],
  spec_lookup:            ["spec","specification","prd","acceptance criteria","requirements","latest","current","final","what is the","edge case","api contract","user stories","success metrics","scope","flow"],
  customer_request:       ["customer","walmart","target","homedepot","pg","loreal","samsung","mamaearth","hdfc","nykaa","flipkart","boat","himalaya","myntra","requested","feature request","cfr","commit","committed","promised","waiting","blocker","escalation","complaint","feedback","nps"],
  research_history:       ["research","analysis","study","was there","did we","have we","prior","before","discovery","interview","benchmark","feasibility","competitive","survey"],
  roadmap_rationale:      ["roadmap","priority","deprioritised","cut","deferred","shelved","icebox","backlog","why was","what was on","h1","h2","q1","q2","q3","q4","descoped","theme"],
  stakeholder_commitment: ["agreed","sign off","signed off","committed","approved","what did","who owns","ceo","cto","vp","outcome","leadership","cross-functional","ask from","committed to"],
  onboarding:             ["overview","strategy","what is","history","full history","how does","what does","onboarding","new pm","who owns","current state","tell me about","organisation","org","departments","stakeholders","revenue","walk me through","guide"],
};

export function detectIntent(query: string): QueryIntent {
  const q = query.toLowerCase();
  const scores = Object.fromEntries(
    Object.keys(INTENT_SIGNALS).map((k) => [k, 0])
  ) as Record<QueryIntent, number>;

  for (const [intent, signals] of Object.entries(INTENT_SIGNALS) as [QueryIntent, string[]][]) {
    for (const signal of signals) {
      if (q.includes(signal)) scores[intent] += 1;
    }
  }

  const best = (Object.entries(scores) as [QueryIntent, number][]).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : "spec_lookup";
}

// Returns the top signal match count — 0 means no intent could be inferred (ambiguous query)
export function detectIntentConfidence(query: string): number {
  const q = query.toLowerCase();
  let max = 0;
  for (const signals of Object.values(INTENT_SIGNALS)) {
    let count = 0;
    for (const signal of signals) {
      if (q.includes(signal)) count++;
    }
    if (count > max) max = count;
  }
  return max;
}

// ── Complex query helpers ──────────────────────────────────────────────────────

export function detectComplexQuery(query: string): boolean {
  const q = query.toLowerCase();
  if (q.includes(" and ") && q.length > 40) return true;
  if ((q.match(/,/g) || []).length >= 2) return true;
  if (/tell me about|overview of|explain|what is the (strategy|plan|org|structure|overview)/.test(q)) return true;
  if ((q.match(/\?/g) || []).length > 1) return true;
  return false;
}

export function decomposeQuery(query: string): string[] {
  const q = query.trim();
  const andParts = q.split(/\s+and\s+/i).map((p) => p.trim()).filter((p) => p.split(" ").length >= 3);
  if (andParts.length > 1 && andParts.length <= 4) return andParts;
  const dashParts = q.split(/\s+[—\-–]\s+/).map((p) => p.trim()).filter((p) => p.length > 5);
  if (dashParts.length > 1) return dashParts;
  const commaParts = q.split(/,\s+/).map((p) => p.trim()).filter((p) => p.split(" ").length >= 2);
  if (commaParts.length >= 2 && commaParts.length <= 4) return commaParts;
  return [q];
}

// ── Filters ────────────────────────────────────────────────────────────────────

export interface SearchFilters {
  sources?: string[];
  author?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ── Citations ──────────────────────────────────────────────────────────────────

export interface Citation {
  id: string;
  source: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  url: string;
}

export function buildCitations(retrieved: RetrievedChunk[]): Citation[] {
  const seen = new Set<string>();
  return retrieved
    .filter((r) => {
      if (seen.has(r.chunk.docId)) return false;
      seen.add(r.chunk.docId);
      return true;
    })
    .map((r) => ({
      id: r.chunk.docId,
      source: r.chunk.doc.source === "notion" ? "Notion"
            : r.chunk.doc.source === "slack"  ? "Slack"
            : r.chunk.doc.source,
      title:   r.chunk.doc.title,
      excerpt: r.chunk.text.slice(0, 220).trim() + (r.chunk.text.length > 220 ? "…" : ""),
      author:  r.chunk.doc.author,
      date:    r.chunk.doc.date,
      url:     r.chunk.doc.url,
    }));
}
