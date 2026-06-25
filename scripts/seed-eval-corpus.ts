/**
 * seed-eval-corpus.ts — Seeds the 20 BazaarVoice synthetic PM documents
 * directly into Supabase (bypasses Notion), so run-evals.ts has real data.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/seed-eval-corpus.ts
 *
 * Safe to re-run: deletes existing eval_corpus docs for the workspace first.
 */

import { createClient } from "@supabase/supabase-js";
import { VoyageAIClient } from "voyageai";
import { randomUUID } from "crypto";

// ── Document corpus ───────────────────────────────────────────────────────────

const DOCS = [
  {
    title: "PRD — Ratings & Reviews API v3.0",
    author: "Priya Mehta",
    date: "2026-04-10",
    url: "https://notion.so/eval-doc-01",
    content: `PRD: Ratings & Reviews API v3.0
Author: Priya Mehta | Status: Approved | Date: 2026-04-10

Problem Statement:
Current API v2 lacks structured attribute-level ratings (e.g., Ease of Use, Value for Money). Enterprise clients like Flipkart and Nykaa are requesting this capability to display richer review widgets. Without it, we risk losing 3 renewal contracts worth ₹2.1Cr ARR.

Proposed Solution:
Extend the Reviews API to support multi-attribute ratings. Each review submission can include up to 8 configurable attributes. Widget renders attribute breakdown alongside star rating.

User Stories:
- As a brand admin, I can configure up to 8 custom rating attributes per product category.
- As an end user, I can rate a product on individual attributes during review submission.
- As a developer, I can query attribute-level aggregates via GET /reviews/aggregate?attributes=true.

Success Metrics:
- Review submission rate: +15% (attribute ratings increase engagement).
- API adoption: 80% of enterprise clients using v3 within 60 days of launch.
- 3 at-risk contracts renewed within 90 days.

Out of Scope: AI-generated attribute suggestions, mobile SDK changes, legacy v1 compatibility.

Timeline:
- May 1: API schema finalized.
- May 20: Beta with 2 design partners.
- June 15: GA release.`,
  },
  {
    title: "Decision Log — Moderation Pipeline Architecture",
    author: "Rahul Sharma",
    date: "2026-03-22",
    url: "https://notion.so/eval-doc-02",
    content: `Decision Log: Moderation Pipeline Architecture
Date: 2026-03-22 | Owner: Rahul Sharma | Status: Decided

Context:
We needed to choose between rule-based moderation (current) and ML-based moderation for review content. Volume has grown to 180K reviews/day and manual review queue is 48 hours behind SLA.

Options Considered:
Option A: Rule-based (current): 22% false positive rate, slow to adapt to new spam patterns.
Option B: ML model (in-house): 4% false positive rate in POC, 3-month build, requires MLOps infra.
Option C: Perspective API (Google): Production-ready, 2-week integration, 6% false positive rate, ~₹8L/month cost, data sent to Google.

Decision:
Option B (in-house ML) with Option C as fallback during build. Rationale: data privacy requirements from 3 BFSI clients prohibit sending review content to third parties. ML team confirmed 10-week delivery.

Consequences:
- ML team allocates 2 engineers for 10 weeks.
- Rule-based remains primary until Week 10.
- Review 30 days post-launch to evaluate false positive rate vs target <5%.`,
  },
  {
    title: "Q3 OKRs — Product Team",
    author: "Priya Mehta",
    date: "2026-06-01",
    url: "https://notion.so/eval-doc-03",
    content: `Q3 2026 OKRs — Product Team
Owner: Priya Mehta | Review cadence: Bi-weekly

Objective 1: Increase enterprise retention.
- KR1.1: Renew 90% of enterprise contracts due in Q3 (currently 3 at risk).
- KR1.2: Achieve NPS >52 from enterprise segment (current: 44).
- KR1.3: Reduce time-to-value for new enterprise onboarding from 8 weeks to 4 weeks.

Objective 2: Expand review volume on platform.
- KR2.1: Reach 200K reviews/day processed (current: 180K).
- KR2.2: Launch attribute-level ratings to 80% of enterprise clients.
- KR2.3: Reduce moderation queue lag from 48h to <2h.

Objective 3: Build data moat.
- KR3.1: Launch Insights API to 10 paid beta customers.
- KR3.2: Aggregate 5M sentiment-tagged reviews for training corpus.
- KR3.3: First enterprise customer live on Review Intelligence dashboard.

Mid-quarter check-in (Week 7):
- KR1.1: 2 of 3 at-risk contracts renewed — on track.
- KR2.3: Queue lag at 18h — behind, needs moderation pipeline fix by Week 9.
- KR3.1: 6 of 10 beta customers onboarded — on track.`,
  },
  {
    title: "Feature Spec — Seller Response Module",
    author: "Ankit Verma",
    date: "2026-05-02",
    url: "https://notion.so/eval-doc-04",
    content: `Feature Spec: Seller Response Module
Author: Ankit Verma | Status: In Review | Date: 2026-05-02

Overview:
Allow brand admins to respond publicly to customer reviews directly from the BazaarVoice dashboard. Responses appear below the original review on the client's product page.

Problem:
63% of shoppers say they're more likely to buy from a brand that responds to negative reviews. Current product has no response capability — brands use email to send us responses and we manually publish them. This creates 3–5 day lag and consumes 0.5 FTE support capacity.

User Flow:
1. Brand admin logs into dashboard → opens Reviews tab.
2. Clicks Respond on any review → rich text editor opens.
3. Writes response (max 600 chars) → Preview → Publish.
4. Response appears on product page within 15 minutes.
5. Email notification sent to original reviewer (optional).

Business Rules:
- One response per review. Editable within 24h of publish.
- Response auto-flagged if it contains pricing claims or competitor mentions.
- Only admin and editor roles can publish responses.

API Changes:
- POST /reviews/{id}/response — body: { text: string, notify_reviewer: boolean }.
- GET /reviews/{id} — response object now includes response field if exists.

Metrics:
- Adoption: 40% of enterprise clients using response module within 60 days.
- Review response rate on platform: target 25% of negative reviews get a response.
- Support tickets for manual publishing: reduce to 0.`,
  },
  {
    title: "Sprint Retro — Q3 Sprint 6",
    author: "Neha Gupta",
    date: "2026-06-13",
    url: "https://notion.so/eval-doc-05",
    content: `Sprint Retrospective: Q3 Sprint 6
Date: 2026-06-13 | Facilitator: Neha Gupta | Team: Core Platform

What went well:
- Attribute ratings API shipped on time — unblocked Flipkart integration.
- Review moderation ML model hit 4.8% false positive rate in staging — better than 5% target.
- New design system components reduced frontend sprint velocity friction.

What didn't go well:
- Seller response module delayed — dependency on Auth team's role system wasn't surfaced until Week 2.
- 2 regression bugs in review submission flow caught by QA, not tests — test coverage gap on submission edge cases.
- Too many context switches — team pulled into 3 customer escalation calls mid-sprint.

Action items:
- Priya: Map all cross-team dependencies at sprint kickoff (not mid-sprint) — Sprint 7.
- Rahul: Add submission edge case tests to CI pipeline — Sprint 7 acceptance criteria.
- Neha: Block no-interrupt hours 10am–12pm daily — try for Sprint 7.

Velocity: Planned: 42 points | Completed: 36 points | Carry-over: Seller response (6 pts).`,
  },
  {
    title: "Customer Discovery — SMB Segment",
    author: "Priya Mehta",
    date: "2026-05-31",
    url: "https://notion.so/eval-doc-06",
    content: `Customer Discovery: SMB Segment
Research owner: Priya Mehta | Interviews: 8 | Date range: May 2026

Hypothesis:
SMB brands (50–500 employees, GMV < ₹50Cr) are underserved by current enterprise-focused product. We believe they want review collection without IT involvement.

Pain points (verbatim themes):
- "Setting up the widget took 3 weeks and needed our developer" — 6 of 8 respondents.
- "We don't have time to read 500 reviews — we need a summary" — 5 of 8.
- "We can't afford ₹2L/month for a tool our team uses 30 min a week" — 7 of 8.

What they're using today:
- Google Reviews (free, no control over display).
- Shopify product reviews plugin (limited — no syndication).
- Manual WhatsApp collection + internal spreadsheet.

Willingness to pay:
Median acceptable price: ₹8,000–12,000/month. 3 of 8 said they'd pay immediately at ₹8K if setup was under 30 minutes.

Implications for roadmap:
- No-code widget setup (iframe embed) — currently requires JS SDK.
- Review summary digest (weekly email) — no dashboard required.
- SMB pricing tier: ₹8K/month, up to 10K reviews/month, 1 product catalogue.

Decision:
Deferred to post-Q3. SMB segment requires separate GTM motion. Flagged for H1 2027 planning.`,
  },
  {
    title: "Incident Report — Review Display Outage",
    author: "Karan Singh",
    date: "2026-05-18",
    url: "https://notion.so/eval-doc-07",
    content: `Incident Report: Review Display Outage
Incident ID: INC-2026-041 | Severity: P1 | Date: 2026-05-18

Summary:
Review display widget was unavailable for 73 minutes on May 18 between 14:22 and 15:35 IST. Affected: all Enterprise clients using JS widget v2.4.x. Reviews showed as blank on product pages.

Impact:
- 14 enterprise clients affected.
- Estimated GMV impact: ₹4.2Cr (based on avg conversion lift attributed to reviews).
- 3 client escalation calls raised within 30 minutes.

Root cause:
CDN config change deployed at 14:18 set incorrect cache-control headers. Widget JS file returned 404 for 73 minutes due to origin path mismatch introduced in the config diff.

Timeline:
- 14:18 — CDN config deployed (automated).
- 14:22 — First 404 errors detected in logs.
- 14:41 — PagerDuty alert fired (19-minute delay due to alert threshold set too high).
- 14:47 — On-call engineer identified CDN as source.
- 15:31 — Config rollback completed.
- 15:35 — Widget serving normally.

Corrective actions:
- CDN config changes now require staging environment validation before prod (ETA: June 1).
- Reduce PagerDuty threshold for widget 404 rate from 5% to 0.5% (done: May 19).
- Add widget availability to executive dashboard (ETA: June 15).`,
  },
  {
    title: "Competitive Analysis — Review Platforms 2026",
    author: "Ankit Verma",
    date: "2026-04-28",
    url: "https://notion.so/eval-doc-08",
    content: `Competitive Analysis: Review Platforms 2026
Author: Ankit Verma | Date: 2026-04-28 | Status: Approved

Market context:
The UGC / review platform market in India is nascent. Most brands still rely on Google Reviews or platform-native reviews. Standalone review platforms have ~12% penetration among D2C brands above ₹10Cr GMV.

Competitor snapshot:
PowerReviews: Deep Shopify integration, strong US presence. No India pricing, no Hindi support, no INR payment. Threat level: Low for India.
Yotpo: Loyalty + reviews bundled, strong SMB motion. Premium pricing (starts $199/month), limited syndication. Threat level: Medium.
Trustpilot: Company-level reviews only, not product-level. Threat level: Low — different use case.
Google Reviews: Free, ubiquitous, trusted. No product-level, no display control, no analytics. Threat level: High as default choice for SMBs.

Our differentiation:
- Only platform with INR pricing and India-first support.
- Syndication network across Indian e-commerce (Nykaa, Myntra, Meesho).
- Compliance with IT Act 2000 data residency requirements.`,
  },
  {
    title: "Roadmap — H2 2026",
    author: "Priya Mehta",
    date: "2026-06-01",
    url: "https://notion.so/eval-doc-09",
    content: `Roadmap: H2 2026
Owner: Priya Mehta | Last updated: 2026-06-01 | Status: Draft for leadership review

Theme 1: Platform reliability (July–August):
- Review display SLA: 99.95% uptime (post-INC-041 remediation).
- Moderation pipeline ML v1 to production.
- CDN redundancy across 3 regions.

Theme 2: Enterprise depth (August–October):
- Attribute-level ratings GA.
- Seller response module launch.
- Review Insights API beta (sentiment + trend data).
- SSO (SAML 2.0) for enterprise dashboard.

Theme 3: Expand network (October–December):
- Syndication partner: Flipkart (in negotiation).
- Syndication partner: JioMart (LOI signed).
- Review import from Amazon and Flipkart via scraper (legal review pending).

Descoped from H2 (moved to H1 2027):
- Mobile SDK for iOS/Android — deprioritised, only 2 clients requested.
- Video reviews — infrastructure cost too high without proven demand.
- SMB self-serve tier — needs separate GTM; not resourced this half.

Dependencies:
- Engineering: ML team capacity confirmed for Themes 1+2.
- Legal: Import feature pending IT Act compliance review (ETA: July 30).
- Partnerships: Flipkart contract needs VP sign-off.`,
  },
  {
    title: "Stakeholder Update — Review Syndication Launch",
    author: "Priya Mehta",
    date: "2026-06-10",
    url: "https://notion.so/eval-doc-10",
    content: `Stakeholder Update: Review Syndication Launch
Date: 2026-06-10 | Audience: VP Product, CEO, Head of Sales | Prepared by: Priya Mehta

What launched:
Review Syndication went live on June 5 with Nykaa as the first syndication partner. Reviews collected on brand.com are now displayed on Nykaa product listings within 4 hours of moderation approval.

Early results (5 days post-launch):
- 12,400 reviews syndicated to Nykaa listings.
- Average rating on syndicated SKUs: 4.3 vs 3.9 on non-syndicated (same brand).
- 3 brands on waitlist for syndication access.
- Nykaa conversion team reporting +8% on syndicated SKUs in A/B test (unconfirmed).

Issues encountered:
- Duplicate review detection: 6% required manual review.
- Image moderation for review photos: not included in v1, Nykaa raised this as required for Phase 2.

Next steps:
- Myntra syndication: contract signed, technical integration starting June 20.
- Image moderation: scoping with ML team — ETA August.
- Duplicate detection: improve to >99% — engineering ticket PLAT-2201.

Ask from leadership:
- CEO: Approve Flipkart syndication term sheet by June 20 (revenue share clause needs exec sign-off).
- VP Product: Confirm image moderation priority vs Seller Response for H2 slot.`,
  },
  {
    title: "PRD — Review Intelligence Dashboard",
    author: "Priya Mehta",
    date: "2026-05-25",
    url: "https://notion.so/eval-doc-11",
    content: `PRD: Review Intelligence Dashboard
Author: Priya Mehta | Status: Draft | Date: 2026-05-25

Problem:
Enterprise brand managers receive raw review data but lack insight. Top question: What are customers actually complaining about this week and is it getting better or worse? Currently requires data analyst to pull reports. No self-serve.

Solution:
A dashboard that automatically surfaces: top 3 sentiment themes this week, trend vs last week, and which SKUs are driving the most negative sentiment. Zero configuration required — powered by existing sentiment model.

Key screens:
Screen 1 Overview: Total reviews this week | Week-over-week delta | Average rating | Sentiment score | Top positive theme | Top negative theme.
Screen 2 Theme Drilldown: Click any theme → see all reviews tagged to that theme. Filter by SKU, rating, date range. Export to CSV.

Target users: Brand manager (primary), Category manager, Head of E-commerce. NOT data analysts or engineers.

MVP constraints:
- English only at launch.
- Up to 5 SKUs per view.
- Refresh: daily (not real-time) for MVP.

Launch plan:
- Beta: 3 enterprise design partners (L'Oreal India, Mamaearth, Boat).
- GA: After 60-day beta with >7 NPS from design partners.`,
  },
  {
    title: "Technical Design — Multi-tenant Data Isolation",
    author: "Karan Singh",
    date: "2026-03-15",
    url: "https://notion.so/eval-doc-12",
    content: `Technical Design: Multi-tenant Data Isolation
Author: Karan Singh (Engineering) | Reviewed by: Priya Mehta | Date: 2026-03-15

Context:
3 BFSI clients (HDFC, Axis, Bajaj Finance) require contractual guarantee that their review data is not co-mingled with data from other tenants. Current architecture uses shared PostgreSQL schemas with tenant_id column isolation.

Current state risk:
Shared schema with row-level tenant_id: sufficient for most clients but does not satisfy BFSI contractual requirements for physical isolation.

Options:
Option A: Schema-per-tenant (PostgreSQL): Each BFSI client gets a dedicated schema. Migration: 2 weeks, zero downtime. Operational cost: +15% DB management overhead.
Option B: Database-per-tenant: Separate RDS instance per BFSI client. Strongest isolation. Cost: +₹40K/month per client, 6-week migration.

Decision:
Option A for current BFSI clients (HDFC, Axis, Bajaj Finance). Option B if we sign clients requiring RBI/SEBI audit compliance (future). Schema-per-tenant satisfies current contractual language. Decision owner: Karan Singh, reviewed by Priya Mehta.

Migration plan:
- Week 1: Schema creation scripts, connection routing layer.
- Week 2: Data migration with dual-write → verify → cutover.
- Week 3: Monitor, decommission shared schema for BFSI tenants.`,
  },
  {
    title: "Customer Feedback Summary — Enterprise Q1 2026",
    author: "Neha Gupta",
    date: "2026-04-05",
    url: "https://notion.so/eval-doc-13",
    content: `Customer Feedback Summary: Enterprise Tier Q1 2026
Source: 14 QBRs, 6 NPS surveys, 3 escalation calls | Compiled by: Neha Gupta | Date: 2026-04-05

NPS summary: Enterprise NPS: 44 (target: 52). Promoters: 5 clients. Passives: 6. Detractors: 3.

Top themes from QBRs:
Theme 1: Slow moderation (mentioned by 9 of 14 clients). Mamaearth PM: "We submit reviews on Monday and they appear Thursday." Boat Head of E-comm: "Our competitors on Nykaa have reviews up same-day."
Theme 2: Lack of analytics self-serve (mentioned by 7 of 14). L'Oreal India: "I email your team every week for a report — this should be automatic." Himalaya: "I can't tell if our rating is improving without calling you."
Theme 3: API documentation gaps (mentioned by 4 of 14). Developer-facing issue — onboarding engineers spend 2x expected time on integration.

Escalations in Q1:
- INC-041: Review display outage (May 18) — 3 formal escalations.
- HDFC Bank: Data residency SLA not met for 6 days in February (root cause: backup job misconfiguration).

Actions taken or planned:
- Moderation SLA: ML pipeline to reduce to <2h (ETA: Q3).
- Analytics: Review Intelligence Dashboard (see PRD).
- API docs: Dedicated technical writer hired, starting June.`,
  },
  {
    title: "Feature Spec — SSO / SAML 2.0 Integration",
    author: "Rahul Sharma",
    date: "2026-05-10",
    url: "https://notion.so/eval-doc-14",
    content: `Feature Spec: SSO / SAML 2.0 Integration
Author: Rahul Sharma | Status: Approved | Date: 2026-05-10

Background:
4 enterprise clients have requested SSO as a condition of renewal or expansion. IT admins cannot provision individual user accounts — they need SAML-based SSO to integrate with their corporate identity provider (Okta, Azure AD).

Scope:
- Support SP-initiated SAML 2.0 SSO.
- IDP support: Okta (P0), Azure AD (P0), Google Workspace (P1).
- Attribute mapping: email, name, role (admin/editor/viewer).
- Just-in-time user provisioning on first SSO login.

Out of scope:
- SCIM provisioning (requested but deferred — only 1 client needs it).
- OIDC / OAuth SSO (evaluate for H1 2027).

Security requirements:
- SAML assertions must be signed.
- Clock skew tolerance: ±5 minutes.
- Session duration: configurable, default 8 hours.
- Force re-auth after session expiry (no silent refresh for enterprise).

Rollout:
- Beta: HDFC Bank and L'Oreal India (both on Okta).
- GA: After 30-day beta with zero auth-related incidents.`,
  },
  {
    title: "Launch Plan — Attribute Ratings GA",
    author: "Priya Mehta",
    date: "2026-06-09",
    url: "https://notion.so/eval-doc-15",
    content: `Launch Plan: Attribute Ratings — GA Release
Owner: Priya Mehta | Launch date: June 15, 2026 | Status: On track

Engineering checklist:
- API v3 endpoints — done (June 5).
- Widget v2.5 with attribute display — done (June 8).
- Load test at 3x peak volume — done (June 9, passed).
- Rollback plan documented — done.

Documentation:
- API changelog published — done.
- Developer migration guide v2→v3 — done.
- Help center article for brand admins — in progress (ETA June 12).

Client readiness:
- Flipkart: integration call June 11, sandbox testing June 12–14.
- Nykaa: already in beta, signed off.
- Mamaearth: skipping v3 until Q4 (resource constraint on their side).

Go-to-market:
- Email blast to all enterprise clients: June 13.
- Blog post: Why attribute ratings drive 23% higher conversion — June 15.
- Sales enablement deck updated with v3 positioning.

Monitoring post-launch:
- Dashboard: API error rate, submission latency, widget load time.
- Alert threshold: >1% error rate triggers PagerDuty.
- First 48h: on-call engineer monitoring every 4 hours.`,
  },
  {
    title: "Decision Log — Pricing Restructure 2026",
    author: "Priya Mehta",
    date: "2026-02-18",
    url: "https://notion.so/eval-doc-16",
    content: `Decision Log: Pricing Restructure 2026
Date: 2026-02-18 | Owner: Priya Mehta + Head of Revenue | Status: Decided

Context:
Current pricing: flat ₹1.5L/month for enterprise regardless of review volume. 3 high-volume clients (>500K reviews/month) are generating 6x the infra cost of average client. Low-volume clients are subsidising them.

Options:
Option A: Usage-based (per review): ₹0.50 per review above 50K/month base. Pros: Aligns cost to value. Cons: Unpredictable invoices, clients push back on variable costs.
Option B: Tiered flat fee: Tier 1 ₹1.5L/month up to 100K reviews. Tier 2 ₹2.5L/month up to 300K reviews. Tier 3 ₹4L/month unlimited. Pros: Predictable, easy to sell. Cons: Blunt.

Decision:
Option B (tiered). Rationale: Sales team strongly opposed variable billing — 2 prospects said it was a deal-breaker. Tiered pricing is standard in the market and easier to forecast. Decision made by Priya Mehta and Head of Revenue on 2026-02-18.

Migration plan:
- New clients: new pricing from April 1.
- Existing clients: grandfathered for remainder of current contract, new pricing at renewal.
- 3 high-volume clients proactively moved to Tier 3 in exchange for 2-year renewal.`,
  },
  {
    title: "Onboarding Guide — Enterprise Client Setup",
    author: "Neha Gupta",
    date: "2026-05-15",
    url: "https://notion.so/eval-doc-17",
    content: `Enterprise Client Onboarding Guide
Version: 3.2 | Owner: Neha Gupta | Last updated: 2026-05-15

Phase 1: Contract to kickoff (Week 0):
- Sales hands off signed contract + client info sheet to CS.
- CS creates client workspace in dashboard (admin account).
- CS schedules kickoff call within 3 business days.

Phase 2: Technical integration (Week 1–2):
- Share API credentials and sandbox environment.
- Developer documentation shared: docs.bazaarvoice.in.
- Integration call with client's dev team (60 min).
- Client completes widget embed on staging — CS validates.
- Go-live approval: CS + client sign-off.

Phase 3: Content strategy (Week 2–3):
- Define moderation ruleset with brand team.
- Configure product catalogue (CSV upload or API).
- Set up email review request templates.
- First review collection campaign live.

Phase 4: Steady state (Week 4+):
- Weekly review volume report sent to client.
- Monthly business review (MBR) scheduled.
- QBR at 90 days.

Common issues and resolutions:
- Widget not loading: Check CSP headers — whitelist cdn.bazaarvoice.in.
- Reviews not appearing: Check moderation rule conflicts with client's custom rules.
- Low review volume: Trigger email campaign, check collection widget placement.

SLA commitments:
- Moderation: <48h (target <2h post-ML launch).
- Support response: <4h for P1, <24h for P2.
- Uptime: 99.9% monthly.`,
  },
  {
    title: "Product Strategy — India Market 2026–2027",
    author: "Priya Mehta",
    date: "2026-06-01",
    url: "https://notion.so/eval-doc-18",
    content: `Product Strategy: India Market 2026–2027
Author: Priya Mehta | Date: 2026-06-01 | Audience: Leadership team

Where we play:
Primary: D2C and omnichannel brands in India with GMV >₹10Cr. Verticals: Beauty, FMCG, Consumer Electronics, Fashion. Secondary: Marketplace sellers on Nykaa, Myntra, Meesho looking for review syndication.

How we win:
- India-first: INR pricing, Hindi + regional language support, local data residency.
- Syndication network: reviews collected once, displayed everywhere (brand.com + marketplaces).
- Speed: industry-leading moderation time post-ML launch (<2h vs 48h market standard).
- Intelligence: Review Intelligence Dashboard — only platform with self-serve sentiment analytics in India.

Where we don't play (yet):
- SMB (<₹10Cr GMV) — GTM is different, unit economics unclear.
- Video reviews — not enough client demand to justify infra investment.
- International markets — focus India through 2027.

12-month priorities:
- H2 2026: Platform reliability + Enterprise depth (SSO, Insights API, Seller Response).
- H1 2027: Syndication scale (5 marketplace partners), SMB evaluation.

Risks:
- Yotpo enters India with aggressive pricing (probability: medium, impact: high).
- Google launches product-level reviews on Search (probability: low, impact: very high).
- Key engineer attrition — ML team is 2 people and both are receiving above-market offers.`,
  },
  {
    title: "API Design Review — Insights API v1",
    author: "Karan Singh",
    date: "2026-05-20",
    url: "https://notion.so/eval-doc-19",
    content: `API Design Review: Insights API v1
Date: 2026-05-20 | Participants: Karan Singh, Rahul Sharma, Priya Mehta

Endpoints approved:
- GET /insights/sentiment — returns sentiment score and top themes for a product or catalogue.
- GET /insights/trends — returns week-over-week rating and sentiment trend.
- GET /insights/topics — returns topic model output with volume per topic.

Query parameters: product_id (optional), date_from, date_to (ISO 8601, max range 90 days), language: en (default), hi (beta).

Design decisions:
Decision 1: Sentiment as normalized score 0–100 (not -1 to 1). Rationale: Brand managers find 0–100 intuitive (like NPS). Developers can rescale. Decided by consensus.
Decision 2: Topics capped at 10 per response. Rationale: Top 10 cover 85% of review volume. Pagination adds complexity for 15% of cases. Deferred.
Decision 3: No real-time endpoint in v1. Rationale: Sentiment model runs in batch (daily). Real-time requires streaming architecture — out of scope for beta.

Open questions:
- Rate limits: 100 calls/day per client in beta. Enough? Confirm with design partners.
- Versioning: /v1/ prefix agreed. Breaking change policy: 6-month deprecation notice.`,
  },
  {
    title: "Meeting Notes — Q3 Planning Session",
    author: "Priya Mehta",
    date: "2026-06-05",
    url: "https://notion.so/eval-doc-20",
    content: `Meeting Notes: Q3 Planning Session
Date: 2026-06-05 | Attendees: Priya Mehta, Rahul Sharma, Karan Singh, Neha Gupta, Ankit Verma

Q2 retro highlights:
- Shipped: Attribute ratings API, syndication with Nykaa, moderation ML in staging.
- Missed: Seller Response (Auth dependency), Review Intelligence Dashboard (design iterations took longer).
- NPS moved from 41 to 44 — progress but below 52 target.

Q3 themes agreed:
- Theme 1: Platform reliability — Karan leads (INC-041 remediation, ML to prod).
- Theme 2: Enterprise depth — Priya leads (Seller Response, SSO, Insights API).
- Theme 3: Analytics — Rahul leads (Review Intelligence Dashboard GA).

Resource allocation:
- Core Platform: 3 engineers, Theme 1 full-time.
- Product Engineering: 4 engineers split Theme 2 and 3.
- ML: 2 engineers, moderation to prod then Insights API.

Dependencies flagged:
- SSO needs Auth team — align on interface by June 20 (Rahul to own).
- Review Intelligence needs data pipeline from ML team (blocking from Week 4).
- Insights API beta launch blocked on legal review of data sharing terms.

Actions:
- Priya: Update OKRs in Notion by June 10.
- Karan: Share reliability runbook with on-call rotation by June 12.
- Neha: Schedule client design partner calls for Review Intelligence beta by June 15.`,
  },
];

// ── Chunker ───────────────────────────────────────────────────────────────────

function chunkText(text: string, maxWords = 400, overlapWords = 50): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let start = 0;
  while (start < words.length) {
    const end = Math.min(start + maxWords, words.length);
    chunks.push(words.slice(start, end).join(" "));
    if (end === words.length) break;
    start = end - overlapWords;
  }
  return chunks;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const voyageKey    = process.env.VOYAGE_API_KEY;

  if (!supabaseUrl || !serviceKey || !voyageKey) {
    throw new Error("Missing env vars. Run with: npx tsx --env-file=.env.local scripts/seed-eval-corpus.ts");
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const voyage   = new VoyageAIClient({ apiKey: voyageKey });

  // Auto-detect or use provided workspace
  const workspaceId = process.env.EVAL_WORKSPACE_ID ?? await (async () => {
    const { data } = await supabase.from("workspaces").select("id").limit(1).single();
    if (!data?.id) throw new Error("No workspace found. Set EVAL_WORKSPACE_ID.");
    return data.id as string;
  })();

  console.log(`\n📚  Seam Eval Corpus Seeder\n    Workspace: ${workspaceId}\n    Documents: ${DOCS.length}\n`);

  // Clean up previous eval corpus for this workspace (identified by provider = "eval_corpus")
  const { data: existingEvalDocs } = await supabase
    .from("documents")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("provider", "eval_corpus");
  if (existingEvalDocs && existingEvalDocs.length > 0) {
    const oldIds = existingEvalDocs.map((d: { id: string }) => d.id);
    await supabase.from("chunks").delete().in("document_id", oldIds);
    await supabase.from("documents").delete().in("id", oldIds);
  }
  console.log("  Cleaned up previous eval corpus.");

  let totalChunks = 0;

  for (const doc of DOCS) {
    process.stdout.write(`  Seeding "${doc.title}"... `);

    const docId = randomUUID();

    // Insert document — external_id doubles as the stable slug for this eval doc
    const externalId = doc.url.split("/").pop()!;
    const { error: docErr } = await supabase.from("documents").insert({
      id:            docId,
      workspace_id:  workspaceId,
      external_id:   externalId,
      title:         doc.title,
      url:           doc.url,
      author:        doc.author,
      provider:      "eval_corpus",
      last_modified: doc.date,
    });
    if (docErr) { console.log(`FAILED (doc): ${docErr.message}`); continue; }

    // Chunk text
    const chunks = chunkText(doc.content);

    // Embed all chunks in one Voyage call
    const embResult = await voyage.embed({ input: chunks, model: "voyage-3-lite" });
    const embeddings = embResult.data?.map((d: { embedding: number[] }) => d.embedding) ?? [];

    // Insert chunks
    const chunkRows = chunks.map((text, i) => ({
      document_id:  docId,
      workspace_id: workspaceId,
      content:      text,
      chunk_index:  i,
      embedding:    JSON.stringify(embeddings[i] ?? []),
    }));

    const { error: chunkErr } = await supabase.from("chunks").insert(chunkRows);
    if (chunkErr) { console.log(`FAILED (chunks): ${chunkErr.message}`); continue; }

    totalChunks += chunks.length;
    console.log(`${chunks.length} chunk${chunks.length > 1 ? "s" : ""} ✓`);
  }

  console.log(`\n✅  Done. ${DOCS.length} documents, ${totalChunks} chunks indexed.`);
  console.log(`    Now run: npx tsx --env-file=.env.local scripts/run-evals.ts\n`);
}

main().catch((err) => {
  console.error("\n❌ Seeder error:", (err as Error).message);
  process.exit(1);
});
