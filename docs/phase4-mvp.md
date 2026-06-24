# Phase 4 — MVP Definition (STAR Format)

## What Seam Does (in the PM's words)
Discover the product problem, history, and stakeholders in one platform —
without opening multiple apps — and lead with numbers and context to be
confident in the PM journey.

---

## STAR

**Situation**
A PM joining a new product spends 3–6 weeks just building context — reading
Notion docs, trawling Jira history, asking stakeholders what was decided and
why. Every answer lives in a different tool. 25 minutes lost per context
switch, 66% of PM time lost to manual information work.

**Task**
Build a single search layer that lets a PM instantly surface product
decisions, stakeholder commitments, customer requests, and roadmap rationale
— across every tool — with cited sources and confidence.

**Action**
Built Seam: a hybrid RAG search product (BM25 + Voyage AI embeddings + RRF +
Claude re-ranking) over documents across Notion, Jira, Slack, and Google
Docs. Detects intent (7 types), returns a single cited answer with source
cards, freshness warnings, and dynamic follow-up suggestions.

OAuth layer: direct OAuth 2.0 per provider (Notion, Jira, Slack, Google Docs)
— no third-party broker. Tokens stored in Supabase `sources.metadata` JSONB
(`access_token`, `refresh_token?`, `docs_indexed`). Google and Jira tokens
proactively refreshed before each sync.

Demo dataset: 20 synthetic BazaarVoice-style PM documents seeded into Notion
(avg 2 pages each) covering roadmap decisions, churn risks, moderation
pipeline, and Q3 planning.

Suggested queries on the search home screen are tied to the seeded dataset:
- "Why did we descope video reviews from the H2 roadmap?"
- "What was decided on the moderation pipeline — rule-based or ML?"
- "Which enterprise clients are at risk of churning and why?"
- "What are the open action items from the Q3 planning session?"

**Result**
A PM can now type one question and get a confident, sourced answer in <5
seconds — without opening Notion, Jira, Slack, or Google Docs. Replaces 25
minutes of context-switching with one query.

---

## Success Metrics (from Phase 1)
| Metric | Target |
|--------|--------|
| Answer Relevance | ≥ 85% |
| Citation Accuracy | ≥ 90% |
| Hallucination Rate | < 5% |
| Latency | < 5s |
