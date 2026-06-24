# Phase 4 — Manual Scoring Sheet
## Instructions
Score each answer 0–5 on three dimensions. Replace `[ ]` with your score.
LLM scores shown for reference — your job is to agree or disagree.

**Relevance (R):** Does it answer the question? 5=perfect, 3=partial, 1=vague, 0=wrong
**Citation (C):** Are claims backed by the sources listed? 5=all backed, 3=mostly, 0=none
**Hallucination (H):** Are all facts in the sources? 5=no hallucination, 3=minor extras, 0=fabricated

---

## Query 1 — Why did Apex decide to build SAML 2.0 SSO?
**Category:** Single Intent | **Intent:** Decision Recall

**Answer:**
Apex decided to build SAML 2.0 SSO because the lack of it directly caused the loss or delay of three enterprise deals in Q2 2025 — Kroger ($220K), Estée Lauder ($190K), and Carrefour ($175K) — totalling $585K in pipeline impact. Enterprise IT security teams were blocking vendor approvals without SAML in place, and Kavitha Suresh escalated the issue to CPO Priya Sharma in July 2025. The decision (PROD-1623) was owned by Ananya Singh and approved by Priya Sharma on August 22, 2025, with the rationale that SAML SSO was table-stakes for enterprise deals, not an optional feature.

**Sources cited:** SSO & Enterprise Security — SAML 2.0 Decision | #roadmap-review: Q1 2026 outcomes | Key Stakeholders & Decision Makers

| | Relevance | Citation | Hallucination |
|---|---|---|---|
| **LLM Score** | 5 | 5 | 5 |
| **Your Score** | [5] | [5] | [5] |
| **Notes** | | | |

---

## Query 2 — What are the acceptance criteria in the Permissions redesign PRD?
**Category:** Single Intent | **Intent:** Spec Lookup

**Answer:**
I searched Notion, Slack and could not find this in your connected sources. Acceptance criteria for the Permissions & Role Management Redesign PRD are not explicitly listed in the document — this information likely lives in a more detailed spec or ticket associated with PROD work tracked by Ananya Singh. Owner: Ananya Singh · Last updated: October 25, 2025.

**Sources cited:** Permissions & Role Management — Redesign PRD | Review Engine PRD v3.0 | Q2 2026 OKRs

| | Relevance | Citation | Hallucination |
|---|---|---|---|
| **LLM Score** | 1 | 5 | 5 |
| **Your Score** | [1 ] | [3] | [0] |
| **Notes** | | Acceptance criteria would lie in Jira docs| |

---

## Query 3 — What did Walmart request and what was the escalation about?
**Category:** Single Intent | **Intent:** Customer Request

**Answer:**
Walmart made two distinct requests. First, in November 2025, Walmart requested brand-level permission isolation, escalated by Arjun Mehta, because their legal team flagged a potential data exposure risk between competing brand teams — being addressed via the Permissions redesign (target: May 2026 pilot). Second, on March 12, 2026, during the Syndication Outage, Walmart's Mike Chen sent a formal escalation email after 12,400 approved reviews were delayed for 4+ hours.

**Sources cited:** Post-mortem: Syndication Outage | Enterprise Tier Expansion | Permissions & Role Management PRD | SSO Decision

| | Relevance | Citation | Hallucination |
|---|---|---|---|
| **LLM Score** | 5 | 5 | 5 |
| **Your Score** | [5] | [5] | [3] |
| **Notes** | | This could also be aggregated from slack channels| |

---

## Query 4 — What did the build vs buy AI analysis conclude?
**Category:** Single Intent | **Intent:** Research History

**Answer:**
Yes, this research exists. Rahul Verma (CTO) authored the Build vs Buy analysis on February 28, 2026. It evaluated three options — building in-house, buying a specialist NLP vendor, and using an LLM API — and recommended Option 3: Claude API, based on validated accuracy of 94.2% (spike PROD-1589), cost of $0.0018/review (~$18,000/month at 10M reviews), and a 4–6 week build timeline vs 12–14 months for in-house.

**Sources cited:** Build vs Buy — AI Sentiment Analysis for Apex Insights v2 | Apex Insights v2 PRD | H1 2026 Product Roadmap

| | Relevance | Citation | Hallucination |
|---|---|---|---|
| **LLM Score** | 5 | 5 | 5 |
| **Your Score** | [3] | [5] | [5] |
| **Notes** | |No clarity in question on Which product's buy vs Build | |

---

## Query 5 — Why was the mobile app deprioritised in H1 2026?
**Category:** Single Intent | **Intent:** Roadmap Rationale

**Answer:**
The native mobile app was deprioritised by Priya Sharma (CPO) on October 8, 2025. The core reasons: 0 of 14 requesting customers said they would churn without it (survey by Arjun Mehta), high engineering cost (6–8 months for a 3-person team for iOS + Android), and opportunity cost vs Visual UGC and SSO which had direct revenue impact.

**Sources cited:** H1 2026 Product Roadmap | Mobile App Deprioritisation Decision | PROD-1834

| | Relevance | Citation | Hallucination |
|---|---|---|---|
| **LLM Score** | 5 | 5 | 5 |
| **Your Score** | [5] | [5] | [5] |
| **Notes** | | | |

---

## Query 6 — Who signed off on the Stripe migration?
**Category:** Single Intent | **Intent:** Stakeholder Commitment

**Answer:**
The decision to migrate from Chargebee to Stripe was owned by Rahul Verma (CTO), documented in the Billing Migration to Stripe — Decision Log dated April 5, 2025. Migration covered 240 enterprise customer subscriptions, completed on schedule by August 31, 2025.

**Sources cited:** Billing Migration to Stripe — Decision Log | Key Stakeholders & Decision Makers

| | Relevance | Citation | Hallucination |
|---|---|---|---|
| **LLM Score** | 5 | 5 | 5 |
| **Your Score** | [5] | [5] | [5] |
| **Notes** | | | |

---

## Query 7 — Tell me about Apex — revenue, products, and key stakeholders
**Category:** Single Intent | **Intent:** Onboarding

**Answer:**
**Revenue:** ARR $19.2M (FY2025), up from $13.7M (40% YoY). NRR 118%, Gross Margin 74%, headcount 130, Series B $42M raised.
**Products:** Review Engine (moderation platform), Visual UGC (photo/video), Syndication Network (250K+ retail touchpoints), Apex Insights v2 (AI sentiment).
**ICPs:** Global retailers (Walmart, Target, Home Depot), CPG brands (P&G, L'Oréal), D2C brands.
**Key Stakeholders:** Vikram Nair (CEO), Priya Sharma (CPO), Rahul Verma (CTO), Ananya Singh (Sr PM), Arjun Mehta (Head of CS).

**Sources cited:** Key Stakeholders & Decision Makers | Company Overview — Apex Platform | FY 2026 Annual Strategy

| | Relevance | Citation | Hallucination |
|---|---|---|---|
| **LLM Score** | 5 | 5 | 5 |
| **Your Score** | [5] | [5] | [5] |
| **Notes** | | | |

---

## Query 8 — What is Apex's FY 2026 strategy and how do the Q2 OKRs connect?
**Category:** Complex Multi-Part | **Intent:** Roadmap Rationale

**Answer:**
Apex's FY 2026 strategy targets growth from $19.2M to $27M ARR (40%) via three bets: win Top 50 Global Retailers, launch AI-Powered Review Intelligence (Insights v2), close the Visual UGC feature gap vs Yotpo/Bazaarvoice. Q2 OKRs map directly: O1 (win 8 new retailer logos, 4 enterprise upgrades), O2 (ship Review Engine v3 bulk moderation by May 15), O3 (launch Visual UGC video support by June 30 for L'Oréal $180K contract).

**Sources cited:** Q2 2026 OKRs | FY 2026 Annual Strategy | FY 2026 Go-to-Market Strategy

| | Relevance | Citation | Hallucination |
|---|---|---|---|
| **LLM Score** | 5 | 5 | 4 |
| **Your Score** | [5] | [5] | [3] |
| **Notes** | | | |

---

## Query 9 — What happened during the Syndication outage and what decisions came out of it?
**Category:** Complex Multi-Part | **Intent:** Decision Recall

**Answer:**
On March 12, 2026, a Kafka partition count increase from 12 to 24 triggered a consumer group rebalance lasting 4 hours 22 minutes (09:14–13:36 IST), causing syndication to go fully down for Walmart, Target, and Home Depot — 23,700 reviews delayed, no data loss. Root cause: change made without testing consumer group behaviour. Decisions: mandatory 48-hour pre-approval for infra changes, circuit breaker on Kafka consumers, dedicated incident commander role, monthly chaos engineering drills.

**Sources cited:** Post-mortem: Syndication Outage — March 12, 2026

| | Relevance | Citation | Hallucination |
|---|---|---|---|
| **LLM Score** | 5 | 5 | 5 |
| **Your Score** | [5] | [5] | [5] |
| **Notes** | | | |

---

## Query 10 — Compare Review Engine and Visual UGC — ICPs and roadmap
**Category:** Complex Multi-Part | **Intent:** Spec Lookup

**Answer:**
**Review Engine:** Moderation platform for enterprise brand managers. AI Assist trained on 40M reviews. ICP: Global retailers (Walmart, Target), CPG brands. Roadmap: bulk moderation + AI assist by May 2026.
**Visual UGC:** Photo/video collection and display for brand pages. ICP: D2C brands (boAt, Nykaa), CPG. Roadmap: video review support by June 2026 (tied to L'Oréal $180K contract), 85% widget load time improvement.

**Sources cited:** Visual UGC — Strategic Decision | Review Engine PRD v3.0 | Q2 2026 OKRs | H1 2026 Product Roadmap

| | Relevance | Citation | Hallucination |
|---|---|---|---|
| **LLM Score** | 5 | 5 | 4 |
| **Your Score** | [5] | [3] | [3] |
| **Notes** | | | |

---

## Query 11 — What enterprise customer feedback drove most roadmap decisions in 2025?
**Category:** Complex Multi-Part | **Intent:** Customer Request

**Answer:**
Top feedback from Q4 2025 Enterprise Feedback Synthesis (Arjun Mehta, Jan 8 2026): 16/24 enterprise accounts (L'Oréal, Nykaa, boAt) demanded video review support — Apex losing Gen Z reviews to competitors. 11/24 flagged slow widget load time (Apex: 2.3s vs Yotpo: 0.9s). Walmart/Target requested bulk moderation (current one-at-a-time is too slow). These three drove Visual UGC video, Review Engine v3 bulk moderation, and the widget performance sprint.

**Sources cited:** Enterprise Customer Feedback Synthesis — Q4 2025 | Pricing Model Decision | SSO Decision

| | Relevance | Citation | Hallucination |
|---|---|---|---|
| **LLM Score** | 5 | 5 | 5 |
| **Your Score** | [5] | [5] | [5] |
| **Notes** | | | |

---

## Query 12 — "billing"
**Category:** Ambiguous | **Expected:** Ambiguity suggestions fired

**Answer:**
The relevant document is "Billing Migration to Stripe — Decision Log." Apex migrated from Chargebee to Stripe Billing, completing on August 31, 2025, covering 240 enterprise subscriptions. Invoice sync errors dropped from 20% to 0.3%, billing incident response improved from 4–6 days to same-day, 60% reduction in manual billing ops.

**Sources cited:** Billing Migration to Stripe — Decision Log | Pricing Model Decision

⚠️ Note: Did ambiguity suggestions fire in the UI? Check manually.

| | Relevance | Citation | Hallucination |
|---|---|---|---|
| **LLM Score** | 5 | 5 | 5 |
| **Your Score** | [5] | [5] | [5] |
| **Notes** | | | |

---

## Query 13 — "api"
**Category:** Ambiguous | **Expected:** Ambiguity suggestions fired

**Answer:**
The most relevant document is "API v2 — Launch Plan & v1 Deprecation." API v2 features: GraphQL + REST, webhooks, bulk endpoints (10K reviews/request), OAuth 2.0, delayed from Q1 to Q3 2026 due to Visual UGC video (PROD-1456). V1 sunset: December 31, 2026. 87 customers currently on v1.

**Sources cited:** API v2 — Launch Plan & v1 Deprecation | H1 2026 Product Roadmap

⚠️ Note: Did ambiguity suggestions fire in the UI? Check manually.

| | Relevance | Citation | Hallucination |
|---|---|---|---|
| **LLM Score** | 5 | 5 | 5 |
| **Your Score** | [5] | [5] | [5] |
| **Notes** | | | |

---

## Query 14 — "permissions"
**Category:** Ambiguous | **Expected:** Ambiguity suggestions fired

**Answer:**
The Permissions & Role Management Redesign PRD covers a full overhaul from 3 roles (Admin, Editor, Viewer) to 5 roles (Super Admin, Brand Admin, Moderator, Analyst, Integration). Driver: Walmart legal flagged data exposure risk between competing brand teams (escalated by Arjun Mehta, Nov 2025). Brand + retailer isolation enforced at the data layer.

**Sources cited:** Permissions & Role Management — Redesign PRD

⚠️ Note: Did ambiguity suggestions fire in the UI? Check manually.

| | Relevance | Citation | Hallucination |
|---|---|---|---|
| **LLM Score** | 5 | 5 | 5 |
| **Your Score** | [5] | [5] | [5] |
| **Notes** | | | |

---

## Query 15 — What is the current status of the Home Depot pilot?
**Category:** Freshness-Sensitive | **Expected:** Freshness warning

**Answer:**
Home Depot GDPR compliance (CFR-804) was on track for April 15 delivery per the H1 roadmap. As of April 2 Slack update from Priya Sharma, not yet shipped but on schedule. Per Q2 OKRs, closing the Home Depot Enterprise upgrade is part of Arjun Mehta's targets.

**Sources cited:** Q2 2026 OKRs | #roadmap-review: Q1 2026 outcomes | H1 2026 Product Roadmap

⚠️ Note: Did freshness warning fire in the UI?

| | Relevance | Citation | Hallucination |
|---|---|---|---|
| **LLM Score** | 5 | 5 | 5 |
| **Your Score** | [5] | [5] | [5] |
| **Notes** | | | |

---

## Query 16 — What is the latest on the API v1 deprecation timeline?
**Category:** Freshness-Sensitive | **Expected:** Freshness warning

**Answer:**
V1 sunset: December 31, 2026 (~12 months after v2 launch). Migration support: dedicated API migration guide + 1:1 sessions for Top 20 API customers. 87 customers currently on v1 (Rajan segmenting by usage volume). Document last updated December 20, 2025 — information may be outdated.

**Sources cited:** API v2 — Launch Plan & v1 Deprecation | H1 2026 Product Roadmap

| | Relevance | Citation | Hallucination |
|---|---|---|---|
| **LLM Score** | 5 | 5 | 5 |
| **Your Score** | [5] | [5] | [5] |
| **Notes** | | | |

---

## Query 17 — What are Apex's current pricing tiers?
**Category:** Freshness-Sensitive | **Expected:** Freshness warning

**Answer:**
Apex uses a module-based subscription model (live April 1, 2025) with three tiers: Base (up to 5K SKUs, 50K reviews/month — $80K ACV), Growth (up to 25K SKUs, 250K reviews/month — $160K ACV), Enterprise (unlimited SKUs + reviews, custom SLA — $250K–$420K ACV).

**Sources cited:** Pricing Model Decision | Freemium vs Enterprise-Only Pricing Analysis

⚠️ Note: Did freshness warning fire in the UI?

| | Relevance | Citation | Hallucination |
|---|---|---|---|
| **LLM Score** | 5 | 5 | 5 |
| **Your Score** | [5] | [5] | [5] |
| **Notes** | | | |

---

## Query 18 — What revenue did Apex lose before building SSO and which deals were affected?
**Category:** Nuanced | **Intent:** Decision Recall

**Answer:**
Prior to SAML 2.0 SSO, Apex lost/pushed $585K in pipeline across three deals in Q2 2025: Kroger ($220K — blocked by IT security), Estée Lauder ($190K — security review failed, pushed to Q3), Carrefour ($175K — lost to PowerReviews who already had SAML). Documented by Ananya Singh in the SSO Decision Notion doc.

**Sources cited:** SSO & Enterprise Security — SAML 2.0 Decision | Company Overview — Apex Platform

| | Relevance | Citation | Hallucination |
|---|---|---|---|
| **LLM Score** | 5 | 5 | 5 |
| **Your Score** | [5] | [5] | [5] |
| **Notes** | | | |

---

## Query 19 — As a new PM at Apex, what are the top 3 strategic bets for this year?
**Category:** Nuanced | **Intent:** Onboarding

**Answer:**
**Bet 1:** Win Top 50 Global Retailers — expand from 22 live retailers to 8 new logos by Q2 2026. Winning a retailer creates network effect forcing brands to join.
**Bet 2:** Launch AI-Powered Review Intelligence (Insights v2) — Claude API at 94.2% accuracy, ship by Aug 2026, opens new $2M+ ARR segment.
**Bet 3:** Close Visual UGC feature gap vs Yotpo — ship video reviews by June 2026 (L'Oréal $180K at risk), 85% widget load time improvement.

**Sources cited:** FY 2026 Annual Strategy | FY 2026 Go-to-Market Strategy | Visual UGC Strategic Decision

| | Relevance | Citation | Hallucination |
|---|---|---|---|
| **LLM Score** | 5 | 5 | 5 |
| **Your Score** | [5] | [5] | [5] |
| **Notes** | | | |

---

## Query 20 — What did Priya Sharma approve in the last 6 months?
**Category:** Nuanced | **Intent:** Stakeholder Commitment

**Answer:**
- August 22, 2025: Approved SAML 2.0 SSO (PROD-1623) as table-stakes enterprise requirement.
- October 8, 2025: Confirmed mobile app deprioritisation, opted for PWA improvements in Q2 2026.
- September 2025: Approved module-based pricing model (live April 1, 2025).
- Approved Visual UGC strategic decision and Enterprise Tier Expansion.

**Sources cited:** SSO Decision | Mobile App Deprioritisation | Pricing Model Decision | Visual UGC Decision

| | Relevance | Citation | Hallucination |
|---|---|---|---|
| **LLM Score** | 5 | 5 | 5 |
| **Your Score** | [5] | [5] | [5] |
| **Notes** | | | |

---

## Summary Table (fill after scoring all 20)

| # | Query (short) | Your R | Your C | Your H | LLM R | LLM C | LLM H | Agree? |
|---|---|---|---|---|---|---|---|---|
| 1 | SSO decision | [ ] | [ ] | [ ] | 5 | 5 | 5 | |
| 2 | Permissions criteria | [ ] | [ ] | [ ] | 1 | 5 | 5 | |
| 3 | Walmart escalation | [ ] | [ ] | [ ] | 5 | 5 | 5 | |
| 4 | Build vs buy | [ ] | [ ] | [ ] | 5 | 5 | 5 | |
| 5 | Mobile deprioritised | [ ] | [ ] | [ ] | 5 | 5 | 5 | |
| 6 | Stripe sign-off | [ ] | [ ] | [ ] | 5 | 5 | 5 | |
| 7 | Apex overview | [ ] | [ ] | [ ] | 5 | 5 | 5 | |
| 8 | FY2026 strategy + OKRs | [ ] | [ ] | [ ] | 5 | 5 | 4 | |
| 9 | Syndication outage | [ ] | [ ] | [ ] | 5 | 5 | 5 | |
| 10 | Review Engine vs UGC | [ ] | [ ] | [ ] | 5 | 5 | 4 | |
| 11 | Enterprise feedback | [ ] | [ ] | [ ] | 5 | 5 | 5 | |
| 12 | billing | [ ] | [ ] | [ ] | 5 | 5 | 5 | |
| 13 | api | [ ] | [ ] | [ ] | 5 | 5 | 5 | |
| 14 | permissions | [ ] | [ ] | [ ] | 5 | 5 | 5 | |
| 15 | Home Depot pilot | [ ] | [ ] | [ ] | 5 | 5 | 5 | |
| 16 | API v1 deprecation | [ ] | [ ] | [ ] | 5 | 5 | 5 | |
| 17 | Pricing tiers | [ ] | [ ] | [ ] | 5 | 5 | 5 | |
| 18 | SSO revenue loss | [ ] | [ ] | [ ] | 5 | 5 | 5 | |
| 19 | New PM top 3 bets | [ ] | [ ] | [ ] | 5 | 5 | 5 | |
| 20 | Priya approvals | [ ] | [ ] | [ ] | 5 | 5 | 5 | |
| **Avg** | | | | | **4.8** | **5.0** | **4.9** | |
