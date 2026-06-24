# Phase 4 — Evals Plan

## Scoring Method: All 3 (Automated → Manual → Hybrid)

### Step 1 — Automated (LLM-as-judge)
- Script runs all 20 queries against Seam
- Records: answer text, sources cited, latency
- Claude scores each on 4 metrics (0–5 scale)

### Step 2 — Manual (Human scoring)
- User runs same 20 queries independently
- Scores each answer on 4 metrics
- Ground truth baseline

### Step 3 — Hybrid (Compare + flag)
- Compare automated vs manual scores
- Any query with ≥2 point disagreement → flagged as edge case
- Edge cases investigated and documented

---

## 4 Metrics

| Metric | Definition | Target | Scale |
|--------|-----------|--------|-------|
| Answer Relevance | Does the answer address the question asked? | ≥ 85% | 0–5 |
| Citation Accuracy | Do cited sources actually support the answer? | ≥ 90% | 0–5 |
| Hallucination | Does answer contain facts NOT in sources? | < 5% | 0–5 (5 = no hallucination) |
| Latency | Time from query to full answer | < 5s | seconds |

---

## 20 Test Queries

### Category A — Single Intent (7)
| # | Query | Intent |
|---|-------|--------|
| 1 | Why did Apex decide to build SAML 2.0 SSO? | Decision Recall |
| 2 | What are the acceptance criteria in the Permissions redesign PRD? | Spec Lookup |
| 3 | What did Walmart request and what was the escalation about? | Customer Request |
| 4 | What did the build vs buy AI analysis conclude? | Research History |
| 5 | Why was the mobile app deprioritised in H1 2026? | Roadmap Rationale |
| 6 | Who signed off on the Stripe migration? | Stakeholder Commitment |
| 7 | Tell me about Apex — revenue, products, and key stakeholders | Onboarding |

### Category B — Complex Multi-Part (4)
| # | Query |
|---|-------|
| 8 | What is Apex's FY 2026 strategy and how do the Q2 OKRs connect to it? |
| 9 | What happened during the Syndication outage and what decisions came out of it? |
| 10 | Compare Review Engine and Visual UGC — what are they, who are the ICPs, and what's the roadmap? |
| 11 | What enterprise customer feedback drove the most roadmap decisions in 2025? |

### Category C — Ambiguous Short Queries (3)
| # | Query | Expected behaviour |
|---|-------|--------------------|
| 12 | billing | 3 suggestions fired |
| 13 | api | 3 suggestions fired |
| 14 | permissions | 3 suggestions fired |

### Category D — Freshness-Sensitive (3)
| # | Query | Expected behaviour |
|---|-------|--------------------|
| 15 | What is the current status of the Home Depot pilot? | Freshness warning |
| 16 | What's the latest on the API v1 deprecation timeline? | Freshness warning |
| 17 | What are Apex's current pricing tiers? | Freshness warning |

### Category E — Nuanced / Multi-Signal (3)
| # | Query |
|---|-------|
| 18 | What revenue did Apex lose before building SSO and which deals were affected? |
| 19 | As a new PM at Apex, what are the top 3 strategic bets for this year? |
| 20 | What did Priya Sharma approve in the last 6 months? |

---

## Output Format
- One table: 20 rows × (Query, Category, Automated Score, Manual Score, Disagreement Flag)
- Latency column separate
- Edge case log for flagged queries
- Final pass/fail vs targets
