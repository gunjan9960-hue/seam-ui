import Anthropic from "@anthropic-ai/sdk";
import { type RetrievedChunk, type QueryIntent } from "./retrieval";

const SOURCE_LABELS: Record<string, string> = {
  notion: "Notion",
  jira:   "Jira",
  slack:  "Slack",
  gdoc:   "Google Docs",
};

const INTENT_SYSTEM_NOTES: Record<QueryIntent, string> = {
  decision_recall:
    "The PM is trying to recall a past decision. Name the decision owner, the date, and the rationale. End with: 'Decision confirmed by [name] ([dept]).'",
  spec_lookup:
    "The PM is looking for a spec or documentation. Cite the document title and state the key details precisely. End with: 'Owner: [name] · Last updated: [date].'",
  customer_request:
    "The PM is asking about a customer request or commitment. Be specific: which customer, what was requested, what was committed, current status, and who owns it.",
  research_history:
    "The PM wants to know if prior research exists. State clearly: was the research done, who did it, when, what the finding was, and where it lives.",
  roadmap_rationale:
    "The PM wants to understand a roadmap decision — why something was prioritised, cut, or deferred. Name who made the call and the specific reasons.",
  stakeholder_commitment:
    "The PM wants to know what was agreed and with whom. Be precise: name the stakeholders, what they agreed to, and any written commitments or deadlines.",
  onboarding:
    "The PM is a new joiner trying to get context. Give a clear, structured overview. Use bullet points. Include owners, current state, key numbers, and key decisions.",
};

// Structured footer requirements — forces the model to surface the fields the judge checks
const INTENT_REQUIRED_FORMAT: Record<QueryIntent, string> = {
  decision_recall: `
REQUIRED — end your answer with exactly this block (fill from sources only):
**Decision owner**: [name and role]
**Date decided**: [date or period]
**Rationale**: [specific reason — not just what was decided]`,

  spec_lookup: `
REQUIRED — end your answer with exactly this block (fill from sources only):
**Document**: [exact document title]
**Owner**: [name]
**Last updated**: [date]`,

  customer_request: `
REQUIRED — end your answer with exactly this block (fill from sources only):
**Customer**: [name]
**Request / issue**: [specific ask or complaint]
**Status**: [current state]
**Owner**: [who is responsible]`,

  research_history: `
REQUIRED — end your answer with exactly this block (fill from sources only):
**Research exists**: Yes / No
**Conducted by**: [name — omit if none]
**Date**: [date or period — omit if none]
**Key finding**: [main conclusion — omit if none]`,

  roadmap_rationale: `
REQUIRED — end your answer with exactly this block (fill from sources only):
**Decision maker**: [name]
**Rationale**: [specific business reasons]
**Trade-off**: [what was weighed or cut instead]`,

  stakeholder_commitment: `
REQUIRED — end your answer with exactly this block (fill from sources only):
**Stakeholder**: [name and role]
**Commitment**: [specific deliverable or decision]
**Deadline**: [date, or "none stated" if absent from sources]`,

  onboarding: `
REQUIRED — structure your answer with ## section headers and bullet points. Include:
- Named owners with roles
- Specific numbers (revenue, headcount, timelines, metrics)
- 2–3 key current decisions or strategic bets`,
};

function isComplexQuery(query: string): boolean {
  const q = query.toLowerCase();
  if (/tell me about|overview|explain|what is the (strategy|org|structure|plan)|who are|departments|stakeholders/.test(q)) return true;
  if ((q.match(/,/g) || []).length >= 2) return true;
  if ((q.match(/\?/g) || []).length > 1) return true;
  if (q.split(" ").length > 15) return true;
  return false;
}

function isCompareQuery(query: string): boolean {
  return /compare|vs\.?\s|versus|difference between|contrast/.test(query.toLowerCase());
}

function buildPrompt(
  query: string,
  history: { question: string; answer: string }[],
  retrieved: RetrievedChunk[],
  intent: QueryIntent,
  isStale: boolean,
  slackHeavy = false,
): string {
  // Number each source so the model can cite by index — prevents cross-source hallucination
  const contextBlocks = retrieved
    .map(
      (r, i) =>
        `[SOURCE ${i + 1}: ${r.chunk.doc.title} · ${r.chunk.doc.author} · ${r.chunk.doc.date}]\n${r.chunk.text}`,
    )
    .join("\n\n---\n\n");

  const cappedHistory = history.slice(-5);
  const historyText =
    cappedHistory.length > 0
      ? "Prior conversation:\n" +
        cappedHistory.map((h) => `Q: ${h.question}\nA: ${h.answer}`).join("\n\n") +
        "\n\n"
      : "";

  const sourceNames = [...new Set(retrieved.map((r) => SOURCE_LABELS[r.chunk.doc.source] ?? r.chunk.doc.source))].join(", ");

  const formatInstruction = isComplexQuery(query)
    ? "Use bullet points or numbered lists. Group related points. Use **bold** for key names, numbers, and decisions."
    : "Answer in 2–4 sentences. Be direct and specific.";

  const compareInstruction = isCompareQuery(query)
    ? "\nThis is a comparison query. For each subject, prefix its facts with the source document title in brackets, e.g. **[Review Engine PRD v3.0]:** … / **[Visual UGC Strategic Decision]:** …"
    : "";

  const freshnessNote = isStale
    ? "\nIMPORTANT: The sources below are older than 90 days. Mention the date of the most recent source in your answer so the PM knows the information may be outdated.\n"
    : "";

  const slackNote = slackHeavy
    ? "\nNote: Most retrieved sources are from Slack threads. Slack data in this workspace may be incomplete — if key details are missing, briefly note that the full context may require checking the channel directly.\n"
    : "";

  return `You are Seam — an AI assistant for product managers that answers questions using their team's documents, tickets, and Slack threads.

${INTENT_SYSTEM_NOTES[intent]}

Context from connected sources (${sourceNames}):
---
${contextBlocks}
---

${historyText}${freshnessNote}${slackNote}Question: ${query}

Instructions:
- ${formatInstruction}${compareInstruction}
- Every factual claim MUST be followed immediately by its source in brackets, e.g. "The decision was made by Rahul Sharma [SOURCE 2]." If you cannot attribute a fact to a numbered source, do not include it.
- ONLY state what a source explicitly says. Do not infer, connect, or combine facts across sources unless the connection is explicitly stated in one of them.
- Do not hallucinate. No dates, names, numbers, or decisions that are not verbatim in a source.
- If the answer is not in the sources, say only: "I searched ${sourceNames} and could not find this in your connected sources."
- Do not fabricate source titles or attribute facts to sources that don't contain them.
${INTENT_REQUIRED_FORMAT[intent]}`;
}

export async function generateAnswer(
  query: string,
  history: { question: string; answer: string }[],
  retrieved: RetrievedChunk[],
  intent: QueryIntent,
  isStale = false,
  slackHeavy = false,
): Promise<AsyncIterable<Anthropic.MessageStreamEvent>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const client = new Anthropic({ apiKey });
  const prompt = buildPrompt(query, history, retrieved, intent, isStale, slackHeavy);
  const maxTokens = isComplexQuery(query) ? 800 : 500;

  return client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });
}

// ── PRD generation ────────────────────────────────────────────────────────────
export const PRD_SECTIONS = [
  "Overview",
  "Problem Statement",
  "Goals",
  "Non-Goals",
  "User Stories",
  "Success Metrics",
  "Out of Scope",
  "Open Questions",
] as const;

export type PrdSection = (typeof PRD_SECTIONS)[number];

export async function generatePRD(
  brief: string,
  tickets: string[],
): Promise<AsyncIterable<Anthropic.MessageStreamEvent>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const client = new Anthropic({ apiKey });
  const ticketsText =
    tickets.length > 0
      ? `\n\nRelated tickets / context:\n${tickets.map((t) => `- ${t}`).join("\n")}`
      : "";

  const prompt = `You are Seam — an AI assistant for product managers.

Generate a structured PRD for the following brief. Use the exact section headings listed below. Be specific, concise, and PM-native. Each section should be 3–6 lines.

Brief: ${brief}${ticketsText}

Write the PRD with these sections in order:
## Overview
## Problem Statement
## Goals
## Non-Goals
## User Stories
## Success Metrics
## Out of Scope
## Open Questions

Guidelines:
- Overview: 2–3 sentences describing what is being built and why.
- Problem: Use specific numbers and quotes if you have them; otherwise write realistically.
- Goals: 3–5 numbered, measurable goals (include target numbers where sensible).
- Non-Goals: 3–4 specific exclusions to prevent scope creep.
- User Stories: 3–4 "As a [role], I want to [action], so that [outcome]." format.
- Success Metrics: A table with Metric | Target | How to Measure.
- Out of Scope: 3–4 items explicitly excluded.
- Open Questions: 3 real open questions that need PM decisions.

Write the full PRD now:`;

  return client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1800,
    messages: [{ role: "user", content: prompt }],
  });
}
