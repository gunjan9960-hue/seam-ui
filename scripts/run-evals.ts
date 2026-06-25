/**
 * run-evals.ts — LLM-as-a-judge eval harness for Seam
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/run-evals.ts
 *
 * What it does:
 *   For each test query → embed → pgvector retrieve → generate answer →
 *   Claude judge with intent-specific rubric → append run to results.json
 */

import { writeFileSync, readFileSync } from "fs";
import { join } from "path";
import Anthropic from "@anthropic-ai/sdk";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { VoyageAIClient } from "voyageai";

// ── Types ─────────────────────────────────────────────────────────────────────

type QueryIntent =
  | "decision_recall"
  | "spec_lookup"
  | "customer_request"
  | "research_history"
  | "roadmap_rationale"
  | "stakeholder_commitment"
  | "onboarding";

type Category = "A-single-intent" | "B-complex" | "C-ambiguous" | "D-freshness" | "E-nuanced";

interface EvalCase {
  id: number;
  query: string;
  category: Category;
  intentExpected: QueryIntent;
}

interface JudgeScores {
  relevance: number;
  citationAccuracy: number;
  hallucination: number;
  intentAdherence: number;
  notes: string;
}

interface EvalResult {
  id: number;
  query: string;
  category: Category;
  intentExpected: QueryIntent;
  intentDetected: QueryIntent;
  intentCorrect: boolean;
  answer: string;
  sourceCount: number;
  sourceTitles: string[];
  isStale: boolean;
  retrievalMs: number;
  generationMs: number;
  totalMs: number;
  llmScores: JudgeScores;
  flags: string[];
  runAt: string;
}

// ── Test suite ────────────────────────────────────────────────────────────────
// Same 20 queries as v1 — extend this array to add new cases.

const TEST_CASES: EvalCase[] = [
  { id: 1,  query: "Why did Apex decide to build SAML 2.0 SSO?",                                                                  category: "A-single-intent", intentExpected: "decision_recall"        },
  { id: 2,  query: "What are the acceptance criteria in the Permissions redesign PRD?",                                            category: "A-single-intent", intentExpected: "spec_lookup"           },
  { id: 3,  query: "What did Walmart request and what was the escalation about?",                                                  category: "A-single-intent", intentExpected: "customer_request"      },
  { id: 4,  query: "What did the build vs buy AI analysis conclude?",                                                             category: "A-single-intent", intentExpected: "research_history"      },
  { id: 5,  query: "Why was the mobile app deprioritised in H1 2026?",                                                            category: "A-single-intent", intentExpected: "roadmap_rationale"     },
  { id: 6,  query: "Who signed off on the Stripe migration?",                                                                     category: "A-single-intent", intentExpected: "stakeholder_commitment" },
  { id: 7,  query: "Tell me about Apex — revenue, products, and key stakeholders",                                                category: "A-single-intent", intentExpected: "onboarding"            },
  { id: 8,  query: "What is Apex's FY 2026 strategy and how do the Q2 OKRs connect to it?",                                      category: "B-complex",       intentExpected: "roadmap_rationale"     },
  { id: 9,  query: "What happened during the Syndication outage and what decisions came out of it?",                              category: "B-complex",       intentExpected: "decision_recall"        },
  { id: 10, query: "Compare Review Engine and Visual UGC — what are they, who are the ICPs, and what is the roadmap?",           category: "B-complex",       intentExpected: "spec_lookup"           },
  { id: 11, query: "What enterprise customer feedback drove the most roadmap decisions in 2025?",                                  category: "B-complex",       intentExpected: "customer_request"      },
  { id: 12, query: "billing",                                                                                                      category: "C-ambiguous",     intentExpected: "decision_recall"        },
  { id: 13, query: "api",                                                                                                          category: "C-ambiguous",     intentExpected: "spec_lookup"           },
  { id: 14, query: "permissions",                                                                                                  category: "C-ambiguous",     intentExpected: "spec_lookup"           },
  { id: 15, query: "What is the current status of the Home Depot pilot?",                                                         category: "D-freshness",     intentExpected: "customer_request"      },
  { id: 16, query: "What is the latest on the API v1 deprecation timeline?",                                                      category: "D-freshness",     intentExpected: "spec_lookup"           },
  { id: 17, query: "What are Apex current pricing tiers?",                                                                        category: "D-freshness",     intentExpected: "decision_recall"        },
  { id: 18, query: "What revenue did Apex lose before building SSO and which deals were affected?",                               category: "E-nuanced",       intentExpected: "decision_recall"        },
  { id: 19, query: "As a new PM at Apex, what are the top 3 strategic bets for this year?",                                       category: "E-nuanced",       intentExpected: "onboarding"            },
  { id: 20, query: "What did Priya Sharma approve in the last 6 months?",                                                         category: "E-nuanced",       intentExpected: "stakeholder_commitment" },
];

// ── Targets ───────────────────────────────────────────────────────────────────

const TARGETS = {
  relevance:       3.5,
  citationAccuracy: 4.0,
  hallucination:   4.0,
  intentAdherence: 3.5,
  retrievalMs:     4000,
  generationMs:    6000,
  totalMs:         10000,
};

// ── Intent detection (mirrors lib/rag/retrieval.ts) ───────────────────────────

const INTENT_SIGNALS: Record<QueryIntent, string[]> = {
  decision_recall:        ["why","decision","decide","decided","chose","choose","rationale","reason","moved","changed","switched"],
  spec_lookup:            ["spec","specification","prd","acceptance criteria","requirements","latest","current","final","what is the","edge case","api contract"],
  customer_request:       ["customer","walmart","target","homedepot","pg","loreal","samsung","requested","feature request","cfr","commit","committed","promised","waiting","blocker"],
  research_history:       ["research","analysis","study","was there","did we","have we","prior","before","discovery","interview","benchmark","feasibility"],
  roadmap_rationale:      ["roadmap","priority","deprioritised","cut","deferred","shelved","icebox","backlog","why was","what was on","h1","h2","q1","q2","q3","q4"],
  stakeholder_commitment: ["agreed","sign off","signed off","committed","approved","what did","who owns","ceo","cto","vp","outcome","leadership","cross-functional"],
  onboarding:             ["overview","strategy","what is","history","full history","how does","what does","onboarding","new pm","who owns","current state","tell me about","organisation","org","departments","stakeholders","revenue"],
};

function detectIntent(query: string): QueryIntent {
  const q = query.toLowerCase();
  const scores = Object.fromEntries(Object.keys(INTENT_SIGNALS).map((k) => [k, 0])) as Record<QueryIntent, number>;
  for (const [intent, signals] of Object.entries(INTENT_SIGNALS) as [QueryIntent, string[]][]) {
    for (const signal of signals) {
      if (q.includes(signal)) scores[intent] += 1;
    }
  }
  const best = (Object.entries(scores) as [QueryIntent, number][]).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : "spec_lookup";
}

// ── Intent-specific judge rubrics ─────────────────────────────────────────────

const INTENT_RUBRICS: Record<QueryIntent, string> = {
  decision_recall: `
INTENT-SPECIFIC — decision_recall:
Score "intentAdherence" 1–5 on whether the answer:
- Names the person who made or approved the decision (required)
- States when the decision was made — a specific date or time period (required)
- Explains WHY the decision was made — the specific rationale, not just what was decided (required)
Score 5: all three present and specific.
Score 3: two of three present, or rationale is vague.
Score 1: only WHAT was decided, with no owner and no rationale.`,

  spec_lookup: `
INTENT-SPECIFIC — spec_lookup:
Score "intentAdherence" 1–5 on whether the answer:
- Cites the specific document title the spec comes from (required)
- States key spec details precisely — fields, criteria, constraints — not vaguely summarised (required)
- Includes the document owner and last-updated date (preferred)
Score 5: all three present.
Score 3: document cited but details are vague or owner/date missing.
Score 1: generic answer with no document reference.`,

  customer_request: `
INTENT-SPECIFIC — customer_request:
Score "intentAdherence" 1–5 on whether the answer:
- Identifies the specific customer by name (required)
- States exactly what was requested, committed, or escalated (required)
- States the current status of that request and who owns it (preferred)
Score 5: all three present and specific.
Score 3: customer and request are named but status/owner is missing.
Score 1: customer not identified or request is vague.`,

  research_history: `
INTENT-SPECIFIC — research_history:
Score "intentAdherence" 1–5 on whether the answer:
- Clearly states whether the research was actually done (yes or no) — not ambiguous (required)
- Names who conducted it and when (required if research exists)
- States the key finding or conclusion of the research (required if research exists)
Score 5: existence clearly stated and (if exists) all details present.
Score 3: research confirmed but finding is vague or author/date missing.
Score 1: ambiguous about whether research was done.`,

  roadmap_rationale: `
INTENT-SPECIFIC — roadmap_rationale:
Score "intentAdherence" 1–5 on whether the answer:
- Explains WHY — specific business reasons, not just "it was deprioritised" (required)
- Names who made the prioritisation call (required)
- Mentions the trade-off, opportunity cost, or alternative chosen (preferred)
Score 5: all three present.
Score 3: reasons given but decision-maker not named, or trade-off missing.
Score 1: only states the roadmap status with no rationale.`,

  stakeholder_commitment: `
INTENT-SPECIFIC — stakeholder_commitment:
Score "intentAdherence" 1–5 on whether the answer:
- Names the specific stakeholder(s) who made the commitment (required)
- States precisely WHAT was committed to — a deliverable or decision, not vague (required)
- Includes a deadline or date if one exists in the sources (required if present in sources)
Score 5: all present and specific.
Score 3: commitment named but stakeholder or deadline missing.
Score 1: generic answer with no named stakeholders.`,

  onboarding: `
INTENT-SPECIFIC — onboarding:
Score "intentAdherence" 1–5 on whether the answer:
- Uses a structured format — headers, bullets, or clear sections — appropriate for a new PM (required)
- Covers multiple dimensions of the topic, not just one aspect (required)
- Includes key numbers, owners, or current state to orient the new PM (required)
Score 5: structured, multi-dimensional, and includes quantitative context.
Score 3: partially structured or covers only one dimension.
Score 1: single unstructured paragraph with no numbers or owners.`,
};

// ── Prompt builders ───────────────────────────────────────────────────────────

const SOURCE_LABELS: Record<string, string> = {
  notion: "Notion",
  jira:   "Jira",
  slack:  "Slack",
  gdoc:   "Google Docs",
};

const INTENT_SYSTEM_NOTES: Record<QueryIntent, string> = {
  decision_recall:        "The PM is trying to recall a past decision. Name the decision owner, the date, and the rationale. End with: 'Decision confirmed by [name] ([dept]).'",
  spec_lookup:            "The PM is looking for a spec or documentation. Cite the document title and state the key details precisely. End with: 'Owner: [name] · Last updated: [date].'",
  customer_request:       "The PM is asking about a customer request or commitment. Be specific: which customer, what was requested, what was committed, current status, and who owns it.",
  research_history:       "The PM wants to know if prior research exists. State clearly: was the research done, who did it, when, what the finding was, and where it lives.",
  roadmap_rationale:      "The PM wants to understand a roadmap decision — why something was prioritised, cut, or deferred. Name who made the call and the specific reasons.",
  stakeholder_commitment: "The PM wants to know what was agreed and with whom. Be precise: name the stakeholders, what they agreed to, and any written commitments or deadlines.",
  onboarding:             "The PM is a new joiner trying to get context. Give a clear, structured overview. Use bullet points. Include owners, current state, key numbers, and key decisions.",
};

function buildAnswerPrompt(
  query: string,
  intent: QueryIntent,
  contextBlocks: string,
  sourceNames: string,
  isStale: boolean,
): string {
  const isComplex = /tell me about|overview|compare|vs\.?|and what|,/.test(query.toLowerCase()) || query.split(" ").length > 12;
  const formatInstruction = isComplex
    ? "Use bullet points or numbered lists. Group related points. Use **bold** for key names, numbers, and decisions."
    : "Answer in 2–4 sentences. Be direct and specific.";
  const freshnessNote = isStale
    ? "\nIMPORTANT: The sources below are older than 90 days. Mention the date of the most recent source in your answer.\n"
    : "";

  return `You are Seam — an AI assistant for product managers.

${INTENT_SYSTEM_NOTES[intent]}

Context from connected sources (${sourceNames}):
---
${contextBlocks}
---
${freshnessNote}
Question: ${query}

Instructions:
- ${formatInstruction}
- Use specific facts, names, dates, ticket numbers, and numbers from the context.
- ONLY state what the context explicitly says. Do not infer, guess, or extrapolate.
- If the answer is not in the context, say only: "I searched ${sourceNames} and could not find this in your connected sources."
- Do not hallucinate. Do not cite sources you were not given.`;
}

function buildJudgePrompt(
  query: string,
  intent: QueryIntent,
  answer: string,
  sourceTitles: string[],
): string {
  return `You are a strict evaluator of RAG (retrieval-augmented generation) answers for a PM knowledge tool called Seam.

Query: "${query}"
Detected intent: ${intent}
Source titles used: ${sourceTitles.join(" | ")}

Answer to evaluate:
"""
${answer}
"""

Score the answer on these 4 dimensions. Return integer scores 1–5 only.

UNIVERSAL (apply to all intents):
1. relevance (1–5): Does the answer directly and completely address what was asked? A non-answer ("not found") scores 1 only if information was available in the source titles.
2. citationAccuracy (1–5): Are the claims traceable to the source titles listed? Penalise if document titles are invented or misattributed.
3. hallucination (1–5): Are there any facts, names, numbers, or dates not supported by the sources? 5 = nothing invented. 1 = multiple invented facts.
${INTENT_RUBRICS[intent]}

Return ONLY valid JSON — no prose, no markdown, just the object:
{
  "relevance": <1-5>,
  "citationAccuracy": <1-5>,
  "hallucination": <1-5>,
  "intentAdherence": <1-5>,
  "notes": "<one concise sentence explaining the scores>"
}`;
}

// ── Stale check ───────────────────────────────────────────────────────────────

function isStaleDate(dateStr: string): boolean {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return true;
  return (Date.now() - d.getTime()) / 86_400_000 > 90;
}

// ── Flag generation ───────────────────────────────────────────────────────────

function buildFlags(
  result: Omit<EvalResult, "flags">,
  targets: typeof TARGETS,
): string[] {
  const flags: string[] = [];
  if (result.llmScores.relevance < 3)           flags.push(`low_relevance:${result.llmScores.relevance}`);
  if (result.llmScores.hallucination < 4)       flags.push(`hallucination_risk:${result.llmScores.hallucination}`);
  if (result.llmScores.intentAdherence < 3)     flags.push(`weak_intent_adherence:${result.llmScores.intentAdherence}`);
  if (result.generationMs > targets.generationMs) flags.push(`generation_slow:${result.generationMs}ms`);
  if (result.totalMs > targets.totalMs)           flags.push(`total_slow:${result.totalMs}ms`);
  if (!result.intentCorrect)                     flags.push(`intent_mismatch:expected_${result.intentExpected}_got_${result.intentDetected}`);
  return flags;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const supabaseUrl   = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey    = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const voyageKey     = process.env.VOYAGE_API_KEY;
  const anthropicKey  = process.env.ANTHROPIC_API_KEY;

  if (!supabaseUrl || !serviceKey || !voyageKey || !anthropicKey) {
    throw new Error("Missing env vars. Run with: npx tsx --env-file=.env.local scripts/run-evals.ts");
  }

  const supabase = createSupabaseClient(supabaseUrl, serviceKey);
  const voyage   = new VoyageAIClient({ apiKey: voyageKey });
  const claude   = new Anthropic({ apiKey: anthropicKey });

  // Auto-detect workspace
  const workspaceId = process.env.EVAL_WORKSPACE_ID ?? await (async () => {
    const { data } = await supabase.from("workspaces").select("id").limit(1).single();
    if (!data?.id) throw new Error("No workspace found. Set EVAL_WORKSPACE_ID in .env.local.");
    return data.id as string;
  })();

  console.log(`\n🔍  Seam Eval Harness v2\n    Workspace: ${workspaceId}\n    Cases: ${TEST_CASES.length}\n`);

  const runAt  = new Date().toISOString();
  const results: EvalResult[] = [];

  for (const tc of TEST_CASES) {
    const start = Date.now();
    process.stdout.write(`  [${tc.id.toString().padStart(2, "0")}] ${tc.query.slice(0, 55).padEnd(55)} `);

    // ── 1. Detect intent ────────────────────────────────────────────────────
    const intentDetected = detectIntent(tc.query);

    // ── 2. Embed query ──────────────────────────────────────────────────────
    const retrievalStart = Date.now();
    const embResult = await voyage.embed({ input: [tc.query], model: "voyage-3-lite" });
    const queryEmbedding = embResult.data?.[0]?.embedding ?? [];

    // ── 3. pgvector search ──────────────────────────────────────────────────
    const { data: chunks } = await supabase.rpc("match_chunks", {
      query_embedding:    queryEmbedding,
      match_workspace_id: workspaceId,
      match_count:        15,
      match_threshold:    0.3,
    });

    const topChunks = (chunks ?? []).slice(0, 5);
    const retrievalMs = Date.now() - retrievalStart;

    // ── 4. Fetch doc metadata ────────────────────────────────────────────────
    const docIds = [...new Set(topChunks.map((c: { document_id: string }) => c.document_id))];
    const { data: documents } = docIds.length > 0
      ? await supabase.from("documents").select("id,title,url,author,provider,last_modified").in("id", docIds)
      : { data: [] };
    const docMap = new Map((documents ?? []).map((d: { id: string; title: string; url: string; author: string; provider: string; last_modified: string }) => [d.id, d]));

    const retrieved = topChunks.map((c: { id: string; document_id: string; content: string; chunk_index: number }) => {
      const doc = docMap.get(c.document_id) as { title: string; provider: string; author: string; last_modified: string; url: string } | undefined;
      return {
        text:     c.content,
        title:    doc?.title    ?? "Untitled",
        source:   doc?.provider ?? "notion",
        author:   doc?.author   ?? "",
        date:     doc?.last_modified ?? "",
        url:      doc?.url      ?? "",
        docId:    c.document_id,
      };
    });

    // ── 5. Generate answer (non-streaming) ───────────────────────────────────
    const sourceNames = [...new Set(retrieved.map((r: { source: string }) => SOURCE_LABELS[r.source] ?? r.source))].join(", ") || "Notion, Jira, Slack";
    const contextBlocks = retrieved
      .map((r: { source: string; title: string; author: string; date: string; text: string }) => `[${SOURCE_LABELS[r.source] ?? r.source}] ${r.title} · ${r.author} · ${r.date}\n${r.text}`)
      .join("\n\n---\n\n");
    const isStale = retrieved.length > 0 && retrieved.every((r: { date: string }) => isStaleDate(r.date));

    const generationStart = Date.now();
    let answer = "";

    if (retrieved.length === 0) {
      answer = `I searched ${sourceNames} and could not find this in your connected sources.`;
    } else {
      const answerMsg = await claude.messages.create({
        model:      "claude-sonnet-4-6",
        max_tokens: 800,
        messages:   [{ role: "user", content: buildAnswerPrompt(tc.query, tc.intentExpected, contextBlocks, sourceNames, isStale) }],
      });
      answer = (answerMsg.content[0] as { type: string; text: string }).type === "text"
        ? (answerMsg.content[0] as { text: string }).text
        : "";
    }

    const generationMs = Date.now() - generationStart;
    const totalMs      = Date.now() - start;

    // ── 6. Judge answer ──────────────────────────────────────────────────────
    const sourceTitles = [...new Set(retrieved.map((r: { title: string }) => r.title))];
    let llmScores: JudgeScores = { relevance: 1, citationAccuracy: 1, hallucination: 5, intentAdherence: 1, notes: "Judge call failed" };

    try {
      const judgeMsg = await claude.messages.create({
        model:      "claude-sonnet-4-6",
        max_tokens: 300,
        messages:   [{ role: "user", content: buildJudgePrompt(tc.query, tc.intentExpected, answer, sourceTitles) }],
      });
      const raw = (judgeMsg.content[0] as { type: string; text: string }).type === "text"
        ? (judgeMsg.content[0] as { text: string }).text.trim()
        : "{}";
      const jsonStr = raw.includes("{") ? raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1) : raw;
      llmScores = JSON.parse(jsonStr) as JudgeScores;
    } catch {
      // keep default scores on parse failure
    }

    // ── 7. Build result ──────────────────────────────────────────────────────
    const partial = {
      id:              tc.id,
      query:           tc.query,
      category:        tc.category,
      intentExpected:  tc.intentExpected,
      intentDetected,
      intentCorrect:   intentDetected === tc.intentExpected,
      answer:          answer.slice(0, 500),
      sourceCount:     retrieved.length,
      sourceTitles,
      isStale,
      retrievalMs,
      generationMs,
      totalMs,
      llmScores,
      runAt,
    };

    const flags = buildFlags(partial, TARGETS);
    const result: EvalResult = { ...partial, flags };
    results.push(result);

    const scoreStr = `R:${llmScores.relevance} C:${llmScores.citationAccuracy} H:${llmScores.hallucination} I:${llmScores.intentAdherence}`;
    const flagStr  = flags.length > 0 ? ` ⚑ ${flags.join(", ")}` : "";
    console.log(`${scoreStr}  ${totalMs}ms${flagStr}`);
  }

  // ── 8. Compute summary ───────────────────────────────────────────────────
  const avg = (arr: number[]) => Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100;

  const summary = {
    avgRelevance:       avg(results.map((r) => r.llmScores.relevance)),
    avgCitationAccuracy: avg(results.map((r) => r.llmScores.citationAccuracy)),
    avgHallucination:   avg(results.map((r) => r.llmScores.hallucination)),
    avgIntentAdherence: avg(results.map((r) => r.llmScores.intentAdherence)),
    avgRetrievalMs:     Math.round(avg(results.map((r) => r.retrievalMs))),
    avgGenerationMs:    Math.round(avg(results.map((r) => r.generationMs))),
    avgTotalMs:         Math.round(avg(results.map((r) => r.totalMs))),
    passRelevance:        avg(results.map((r) => r.llmScores.relevance))       >= TARGETS.relevance,
    passCitationAccuracy: avg(results.map((r) => r.llmScores.citationAccuracy)) >= TARGETS.citationAccuracy,
    passHallucination:    avg(results.map((r) => r.llmScores.hallucination))   >= TARGETS.hallucination,
    passIntentAdherence:  avg(results.map((r) => r.llmScores.intentAdherence)) >= TARGETS.intentAdherence,
    passLatency:          Math.round(avg(results.map((r) => r.totalMs)))       <= TARGETS.totalMs,
    intentAccuracy:       Math.round((results.filter((r) => r.intentCorrect).length / results.length) * 100),
    overallPass: false,
  };
  summary.overallPass =
    summary.passRelevance &&
    summary.passCitationAccuracy &&
    summary.passHallucination &&
    summary.passIntentAdherence &&
    summary.passLatency;

  // ── 9. Append run to results.json ────────────────────────────────────────
  const resultsPath = join(process.cwd(), "lib", "evals", "results.json");
  let existing: unknown[] = [];
  try { existing = JSON.parse(readFileSync(resultsPath, "utf-8")) as unknown[]; } catch { /* first run */ }

  const runNumber = existing.length + 1;
  const newRun = {
    version: `v${runNumber}`,
    runAt,
    targets: TARGETS,
    results,
    summary,
  };

  writeFileSync(resultsPath, JSON.stringify([...existing, newRun], null, 2));

  // ── 10. Print summary ────────────────────────────────────────────────────
  const pass = (b: boolean) => b ? "✅" : "❌";
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Run ${newRun.version} complete — ${results.length} queries
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Relevance        ${summary.avgRelevance}/5        ${pass(summary.passRelevance)}  (target ≥${TARGETS.relevance})
  Citation         ${summary.avgCitationAccuracy}/5        ${pass(summary.passCitationAccuracy)}  (target ≥${TARGETS.citationAccuracy})
  Hallucination    ${summary.avgHallucination}/5        ${pass(summary.passHallucination)}  (target ≥${TARGETS.hallucination})
  Intent adherence ${summary.avgIntentAdherence}/5        ${pass(summary.passIntentAdherence)}  (target ≥${TARGETS.intentAdherence})
  Intent accuracy  ${summary.intentAccuracy}%
  Retrieval        ${summary.avgRetrievalMs}ms     ${pass(summary.avgRetrievalMs <= TARGETS.retrievalMs)}  (target <${TARGETS.retrievalMs}ms)
  Generation       ${summary.avgGenerationMs}ms     ${pass(summary.avgGenerationMs <= TARGETS.generationMs)}  (target <${TARGETS.generationMs}ms)
  Total            ${summary.avgTotalMs}ms     ${pass(summary.passLatency)}  (target <${TARGETS.totalMs}ms)

  Overall: ${summary.overallPass ? "✅ ALL PASS" : "❌ NEEDS WORK"}
  Results written → lib/evals/results.json (${runNumber} run${runNumber > 1 ? "s" : ""} total)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main().catch((err) => {
  console.error("\n❌ Eval harness error:", (err as Error).message);
  process.exit(1);
});
