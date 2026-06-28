#!/usr/bin/env npx tsx
/**
 * Seam — Full Synthetic PM Corpus Seeder
 *
 * Creates 25 Notion pages:
 *   - Company vision / org / strategy / OKRs / stakeholder map
 *   - 20 product pages with roadmaps, decisions, and PM owners
 *
 * Outputs Slack messages for 5 channels (manual paste — no chat:write scope).
 *
 * Run: npx tsx scripts/seed-full-corpus.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// ── env ────────────────────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const eq = line.indexOf("=");
    if (eq > 0 && !line.startsWith("#")) {
      const key = line.slice(0, eq).trim();
      const val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const NOTION_VER    = "2022-06-28";

// ── Notion helpers ─────────────────────────────────────────────────────────────
const h1 = (t: string) => ({ object:"block",type:"heading_1", heading_1:{rich_text:[{type:"text",text:{content:t}}]} });
const h2 = (t: string) => ({ object:"block",type:"heading_2", heading_2:{rich_text:[{type:"text",text:{content:t}}]} });
const h3 = (t: string) => ({ object:"block",type:"heading_3", heading_3:{rich_text:[{type:"text",text:{content:t}}]} });
const p  = (t: string) => ({ object:"block",type:"paragraph", paragraph:{rich_text:[{type:"text",text:{content:t}}]} });
const b  = (t: string) => ({ object:"block",type:"bulleted_list_item", bulleted_list_item:{rich_text:[{type:"text",text:{content:t}}]} });
const n  = (t: string) => ({ object:"block",type:"numbered_list_item", numbered_list_item:{rich_text:[{type:"text",text:{content:t}}]} });
const div = ()         => ({ object:"block",type:"divider",divider:{} });
const call = (t: string, emoji: string) => ({
  object:"block",type:"callout",
  callout:{rich_text:[{type:"text",text:{content:t}}],icon:{type:"emoji",emoji}},
});

async function notionPost(path: string, token: string, body: object) {
  const r = await fetch(`https://api.notion.com/v1${path}`, {
    method:"POST",
    headers:{ Authorization:`Bearer ${token}`, "Notion-Version":NOTION_VER, "Content-Type":"application/json" },
    body: JSON.stringify(body),
  });
  return r.json();
}

async function createPage(token: string, parentId: string | null, title: string, blocks: object[]) {
  // Notion allows max 100 children per request
  const first100 = blocks.slice(0, 99);
  const parent = parentId ? { page_id: parentId } : { type: "workspace", workspace: true };
  const res: { id?: string; object?: string; message?: string } = await notionPost("/pages", token, {
    parent,
    properties:{ title:{ title:[{ type:"text", text:{ content: title } }] } },
    children: first100,
  });
  if (!res.id) {
    console.error(`  ✗ Failed: ${title} —`, (res as {message?:string}).message ?? JSON.stringify(res).slice(0,120));
    return null;
  }
  // Append remaining blocks if > 99
  if (blocks.length > 99) {
    await notionPost(`/blocks/${res.id}/children`, token, { children: blocks.slice(99) });
  }
  console.log(`  ✓ ${title}`);
  return res.id as string;
}

// ── Company & org ──────────────────────────────────────────────────────────────

const COMPANY_VISION: object[] = [
  call("Company: Apex Commerce — B2B SaaS · Commerce Content & Intelligence Platform · Series C · Founded 2019 · 210 employees · HQ Bengaluru + NYC", "🏢"),
  h2("Mission"),
  p("Apex Commerce enables brands to turn authentic customer voice into their most powerful growth lever — across every channel, every market, every moment of purchase."),
  h2("Vision"),
  p("By 2027, every major consumer brand in India and Southeast Asia uses Apex Commerce as the operating system for commerce content: collecting, moderating, syndicating, and measuring user-generated content at scale."),
  h2("Core Values"),
  b("Truth before optics — we show brands their real ratings, not filtered vanity metrics."),
  b("Speed with rigour — ship fast, but with data to back every decision."),
  b("PM as architect — product managers own outcomes, not just features."),
  b("India-first, not India-only — build for India's complexity first, then scale globally."),
  div(),
  h2("Strategic Pillars FY2026"),
  n("Win Indian enterprise market: Target Top 50 D2C brands and 10 large retailers."),
  n("Expand content types: Add video UGC and AI-generated review summaries to core platform."),
  n("Developer ecosystem: Launch API Developer Portal and SDK for third-party integrations."),
  n("Intelligence layer: Analytics Dashboard becomes the primary upsell anchor."),
  n("Profitability path: Reduce LLM costs by 40% via model tiering (Haiku for moderation, Sonnet for generation)."),
  div(),
  h2("Key Numbers — H1 2026"),
  b("ARR: ₹38 Cr (growing 62% YoY)"),
  b("Enterprise clients: 47 active (retention 94%)"),
  b("Reviews processed monthly: 4.2 million"),
  b("Avg NPS from enterprise clients: 52"),
  b("Runway: 28 months at current burn"),
  div(),
  h2("What Apex Is NOT"),
  b("We are NOT a social listening tool — we work with owned content, not crawled social data."),
  b("We are NOT a CRM — we plug into Salesforce, HubSpot, but do not replace them."),
  b("We are NOT a Shopify app — we serve enterprise retail, not SMB DTC."),
];

const ORG_STRUCTURE: object[] = [
  call("Last updated: June 2026 — approved by Vikram Nair (CEO)", "🏛️"),
  h2("Executive Leadership"),
  b("CEO: Vikram Nair — overall strategy, fundraising, board. Ex-Flipkart, IIT Bombay."),
  b("CTO: Rahul Sharma — engineering, platform, data infrastructure. Ex-Google, IIT Delhi."),
  b("CPO: Priya Mehta — product strategy, PM org, design. Ex-Meesho, IIM Ahmedabad."),
  b("CFO: Ananya Singh — finance, legal, investor relations. Ex-McKinsey."),
  b("VP Sales: Sandeep Gupta — enterprise sales, partnerships, revenue. Ex-SAP India."),
  b("VP Engineering: Deepa Reddy — engineering execution, hiring, tech debt. Ex-Amazon."),
  b("Head of Design: Shreya Patel — UX, design system, research. Ex-Swiggy."),
  b("Head of Marketing: Nikhil Bose — demand gen, content, analyst relations."),
  div(),
  h2("Product Management Org — Reports to Priya Mehta (CPO)"),
  b("Arjun Kapoor — Group PM, Core Platform (Ratings & Reviews, Review Engine, Moderation)"),
  b("Neha Joshi — PM, Ratings & Reviews API"),
  b("Rohan Verma — PM, Visual UGC"),
  b("Kavitha Nair — PM, Review Engine"),
  b("Aditya Patel — PM, Syndication Platform"),
  b("Shruti Agarwal — PM, Q&A Module"),
  b("Manish Kumar — PM, Social Commerce"),
  b("Pooja Iyer — PM, Influencer Hub"),
  b("Karan Mehta — PM, Sampling & Advocacy"),
  b("Divya Sharma — PM, Loyalty & Rewards"),
  b("Ravi Krishnan — PM, Analytics Dashboard"),
  b("Swati Gupta — PM, Moderation Suite"),
  b("Amit Sinha — PM, Brand Portal"),
  b("Priyanka Jain — PM, Retail Intelligence"),
  b("Aakash Rao — PM, Search & Discovery"),
  b("Meera Nambiar — PM, Checkout Optimization"),
  b("Suresh Pillai — PM, Review Widgets"),
  b("Anjali Malhotra — PM, Content Distribution"),
  b("Rajesh Tiwari — PM, Competitor Benchmarking"),
  b("Ishaan Chandra — PM, API Developer Portal"),
  b("Tanvi Bhatt — PM, Enterprise SSO & Admin"),
  div(),
  h2("Engineering Teams"),
  b("Platform Engineering (12): Core API, auth, data pipeline — Lead: Sanjay Iyer"),
  b("Frontend Engineering (8): Brand Portal, widgets, dashboard — Lead: Aditi Mishra"),
  b("ML & AI (6): Moderation, ranking, summarisation — Lead: Dr. Ankit Jain"),
  b("Data Engineering (5): Warehousing, analytics pipeline — Lead: Kunal Rao"),
  b("DevOps/Infra (4): AWS, Kubernetes, CI/CD — Lead: Rahul Bhat"),
  div(),
  h2("Key Enterprise Stakeholders (Customer Side)"),
  b("Walmart India: Preethi Raj (Director, Digital Commerce) — P0 enterprise account, ₹4.2 Cr ARR"),
  b("Nykaa: Simran Kaur (VP, Digital Experience) — P0, ₹2.8 Cr ARR, expansion in discussion"),
  b("Myntra: Aditya Bose (Head, Content Tech) — P1, ₹1.9 Cr ARR"),
  b("boAt: Riya Malhotra (Head, Product) — P1, ₹1.4 Cr ARR, early adopter of Visual UGC"),
  b("Mamaearth: Gaurav Singh (VP, Ecommerce) — P1, ₹1.1 Cr ARR"),
  b("Flipkart: Siddharth Roy (Director, Seller Platform) — P2, pilot phase, ₹0.8 Cr ARR"),
  b("HDFC Bank: Tanu Mehrotra (VP, Digital) — P2, pilot on Financial Product Reviews"),
  b("Himalaya: Rakesh Nair (Head, Marketing Tech) — P2, SMB tier"),
  b("Croma: Vandana Shah (Director, eCommerce) — P2, new acquisition Q1 2026"),
];

const STRATEGY_FY2026: object[] = [
  call("FY2026 Strategy — Approved by Vikram Nair (CEO) and Priya Mehta (CPO) in January 2026 planning session", "🎯"),
  h2("Theme: From Feature Provider to Commerce Intelligence Platform"),
  p("In FY2025, Apex grew ARR by 62% primarily by selling point solutions — Ratings & Reviews to one buyer, Syndication to another. FY2026 is about selling the platform: a single contract covering 3+ products with Analytics Dashboard as the intelligence layer that ties them together."),
  div(),
  h2("Strategic Bets — Ranked by Expected ARR Impact"),
  n("Analytics Dashboard as upsell anchor (expected +₹8 Cr ARR): Every enterprise customer gets access. Paid tier unlocks competitive benchmarking, trend forecasting, and weekly executive digest."),
  n("Video UGC expansion (+₹5 Cr ARR): Visual UGC product extended to support 60-second video reviews. Nykaa and boAt have pre-committed pending GA release."),
  n("API Developer Portal (+₹3 Cr ARR via new channel partners): Self-serve API onboarding removes sales friction for SMB tier. Three channel partners signed LOI."),
  n("Southeast Asia entry (+₹2 Cr ARR): Singapore-first, focus on brands already operating across India and SG. Tokopedia and Shopee integrations required."),
  n("Enterprise SSO & Admin (+₹1.5 Cr ARR uplift): Blocker for 11 enterprise deals. Priyanka's team has sign-off to make this P0 for Q2 2026."),
  div(),
  h2("What We Deprioritised in FY2026 and Why"),
  b("Mobile app for end-consumers: Not our ICP. Brands are our customer, not shoppers. Deferred indefinitely."),
  b("Shopify plugin: Market is SMB, not enterprise. Margin is too low. Deferred to FY2027."),
  b("AI Review Writing Assistance: Legal flagged it as creating authenticity risk. Removed from roadmap June 2025."),
  b("Social listening / sentiment on external platforms: Out of scope — we work with owned data only."),
  div(),
  h2("Key Cross-Functional Commitments"),
  b("Q2 2026: Enterprise SSO GA — committed to Walmart India and Nykaa (both waiting to expand)."),
  b("Q3 2026: Video UGC GA — committed to boAt (₹1.4 Cr contract expansion pending)."),
  b("Q3 2026: Analytics Dashboard paid tier launch — pricing approved by Ananya Singh (CFO)."),
  b("Q4 2026: API Developer Portal v1 — committed to 3 channel partners (contracts signed)."),
  div(),
  h2("Risk Register"),
  b("Risk 1 (HIGH): LLM costs growing 8% MoM as moderation volume scales. Mitigation: Claude Haiku for moderation (saving 65% per call). Decision: Rahul Sharma approved June 2026."),
  b("Risk 2 (HIGH): Enterprise SSO — engineering estimate slipped 3 weeks. Tanvi's team needs 2 additional engineers. Deepa Reddy to reassign from Sampling team by July 15."),
  b("Risk 3 (MEDIUM): Walmart India contract renewal in September 2026. Preethi Raj flagged 3 open issues — must close by August 15."),
  b("Risk 4 (MEDIUM): Myntra evaluating a competitor (Yotpo). Sandeep Gupta to run competitive review by end of Q2."),
];

const OKRS_H1_2026: object[] = [
  call("H1 2026 OKRs — Set January 2026, Reviewed by Priya Mehta and Arjun Kapoor quarterly", "📊"),
  h2("Company OKR 1: Grow ARR to ₹42 Cr by June 30, 2026"),
  b("KR1.1: Net new ARR from upsell ≥ ₹6 Cr (owner: Sandeep Gupta, VP Sales)"),
  b("KR1.2: Enterprise churn rate < 4% (owner: Arjun Kapoor, Group PM)"),
  b("KR1.3: 3 new enterprise logos > ₹1 Cr ARR each (owner: Sandeep Gupta)"),
  p("Status June 2026: ARR at ₹38 Cr. Net new upsell at ₹4.2 Cr — behind target. 2 new logos closed (Croma, HDFC). Churn at 6% — above target due to Himalaya downgrade."),
  div(),
  h2("Company OKR 2: Platform depth — avg products per customer ≥ 2.5"),
  b("KR2.1: Launch Analytics Dashboard paid tier by May 31 (owner: Ravi Krishnan)"),
  b("KR2.2: 15 enterprise customers using ≥ 3 Apex products (owner: Arjun Kapoor)"),
  b("KR2.3: Net Promoter Score ≥ 55 (owner: Priya Mehta)"),
  p("Status June 2026: Analytics paid tier delayed to Q3. 11 customers on 3+ products. NPS at 52 — short of 55 target."),
  div(),
  h2("Product OKR 1: Ship Enterprise SSO & Admin GA by Q2 end"),
  b("KR: All 11 waiting enterprise deals unblocked (owner: Tanvi Bhatt, PM)"),
  b("KR: SSO supports Google, Okta, Azure AD on day one (owner: Deepa Reddy)"),
  b("KR: Zero P0 security incidents in first 60 days post-launch"),
  p("Status June 2026: Development at 80%. GA expected July 30 — 4 weeks behind plan. Walmart India and Nykaa notified of delay. Both have confirmed continued commitment."),
  div(),
  h2("Product OKR 2: Visual UGC — Video support in GA by Q3 2026"),
  b("KR: Video upload, transcoding, moderation pipeline live in staging by June 15"),
  b("KR: boAt pilot completes with ≥ 4.0/5 CSAT on video moderation quality"),
  b("KR: P99 video processing latency < 90 seconds for 60s clips"),
  p("Status June 2026: Video pipeline in staging. boAt pilot starting July 1. On track."),
  div(),
  h2("Product OKR 3: Moderation Suite — LLM cost per review < ₹0.08"),
  b("KR: Claude Haiku replaces Sonnet for moderation by May 1 (owner: Swati Gupta)"),
  b("KR: False positive rate remains < 2% after model switch (owner: Dr. Ankit Jain, ML Lead)"),
  b("KR: Total moderation cost per review < ₹0.08 (down from ₹0.22)"),
  p("Status June 2026: Haiku migration complete May 20. Cost now ₹0.09/review — improved but not yet at target. False positive rate at 1.8% — within target."),
];

const STAKEHOLDER_MAP: object[] = [
  call("Enterprise Stakeholder Map — Maintained by Sandeep Gupta (VP Sales) and Arjun Kapoor (Group PM). Last updated June 2026.", "🗺️"),
  h2("Tier 1 — P0 Accounts (₹2 Cr+ ARR)"),
  h3("Walmart India — ₹4.2 Cr ARR"),
  b("Primary contact: Preethi Raj, Director Digital Commerce — preethi.raj@walmart.com"),
  b("Technical champion: Mohan Das, Engineering Manager"),
  b("Open issues: (1) SSO integration blocked — waiting for Apex GA. (2) Video UGC pilot requested for Q3. (3) Analytics export API not meeting latency SLA (>3s, target <1s)."),
  b("Renewal date: September 15, 2026. At risk if SSO not live by August 15."),
  b("Committed features: Enterprise SSO, Analytics export API, Priority moderation queue"),
  h3("Nykaa — ₹2.8 Cr ARR"),
  b("Primary contact: Simran Kaur, VP Digital Experience — simran.kaur@nykaa.com"),
  b("Expansion in discussion: +₹1.5 Cr for Visual UGC + Analytics Dashboard paid tier"),
  b("Key ask: Video UGC by Q3 2026, influencer review tagging, GDPR-ready data exports"),
  b("Relationship health: Strong. Simran attended Apex Summit 2026 as speaker."),
  div(),
  h2("Tier 2 — P1 Accounts (₹1–2 Cr ARR)"),
  h3("Myntra — ₹1.9 Cr ARR"),
  b("Primary contact: Aditya Bose, Head Content Tech"),
  b("Risk: Evaluating Yotpo as alternative. Sandeep Gupta running competitive briefing July 10."),
  b("Feature asks: Real-time review syndication to Myntra app, custom moderation rules."),
  h3("boAt — ₹1.4 Cr ARR"),
  b("Primary contact: Riya Malhotra, Head Product"),
  b("Committed: Video UGC GA by Q3 2026. Contract expansion (+₹0.8 Cr) contingent on GA."),
  b("Loves: Fast implementation, responsive PM (Rohan Verma), quality of photo UGC"),
  h3("Mamaearth — ₹1.1 Cr ARR"),
  b("Primary contact: Gaurav Singh, VP Ecommerce"),
  b("Ask: Influencer Hub integration with their existing creator programme. Pooja Iyer in discussion."),
  b("Risk: Low — strong NPS, no churn signals."),
  div(),
  h2("Tier 3 — P2 Accounts (< ₹1 Cr ARR / Pilot)"),
  b("Flipkart (₹0.8 Cr): Siddharth Roy — Seller platform pilot. Decision on expansion expected Q3 2026."),
  b("HDFC Bank (pilot): Tanu Mehrotra — Financial product reviews pilot. First fintech use case. Outcome by August 2026."),
  b("Himalaya (₹0.7 Cr): Rakesh Nair — Downgraded from P1 in April 2026 after budget cut. Retention at risk — Karan Mehta handling."),
  b("Croma (new, ₹0.4 Cr): Vandana Shah — Q1 2026 acquisition. Onboarding complete. First renewal December 2026."),
  div(),
  h2("Feature Commitments Tracker"),
  b("Enterprise SSO: Committed to Walmart India + Nykaa. Due July 30, 2026 (4 weeks late)."),
  b("Analytics Export API < 1s: Committed to Walmart India. Due August 15, 2026."),
  b("Video UGC GA: Committed to boAt + Nykaa. Due Q3 2026 (on track)."),
  b("Influencer Hub × Mamaearth creator data: In scoping. No commit date yet."),
  b("Custom moderation rules: Committed to Myntra. Due Q3 2026. Owner: Swati Gupta."),
];

// ── 20 Product pages ───────────────────────────────────────────────────────────

interface ProductSpec {
  title: string;
  pm: string;
  stage: string;
  arr: string;
  blocks: object[];
}

const PRODUCTS: ProductSpec[] = [
  {
    title: "Product: Ratings & Reviews API",
    pm: "Neha Joshi",
    stage: "GA · Core Revenue",
    arr: "₹14 Cr ARR (37% of total)",
    blocks: [
      call("PM: Neha Joshi · Group PM: Arjun Kapoor · Engineering Lead: Sanjay Iyer · Stage: GA · ARR: ₹14 Cr", "⭐"),
      h2("What it does"),
      p("Core product. REST + GraphQL API for collecting, storing, moderating, and serving customer ratings and reviews. Powers the review widgets, brand portal, and analytics layer. 4.2M reviews processed monthly."),
      h2("Current Status"),
      b("API v3.5 in production — stable, 99.98% uptime over last 12 months"),
      b("Serving 47 enterprise clients including Walmart India, Nykaa, Myntra"),
      b("Average response time: 142ms (p99: 380ms)"),
      b("Major Q1 2026 release: Attribute-based ratings (sub-ratings per product dimension)"),
      h2("H2 2026 Roadmap"),
      n("v3.6 — Real-time webhook delivery of new reviews to brand systems (July 2026)"),
      n("v3.7 — AI-generated review summary endpoint (1 paragraph synthesis from all reviews) (September 2026)"),
      n("v3.8 — Multi-locale support: Hindi, Tamil, Telugu (November 2026)"),
      n("Analytics API v2 — sub-second latency, requested by Walmart India (August 2026)"),
      h2("Key Decisions"),
      b("Decision (March 2026): Chose GraphQL over REST-only because Nykaa and Myntra both requested it. Decision owner: Neha Joshi, approved by Arjun Kapoor."),
      b("Decision (Jan 2026): Dropped v1 API deprecation from H1 roadmap — 3 legacy clients (Himalaya, Rakesh Nair flagged) not yet migrated. Deferred to Q4 2026."),
      b("Decision (Oct 2025): Moved to per-API-call pricing model for SMB tier — approved by Ananya Singh (CFO) and Sandeep Gupta (VP Sales)."),
      h2("Open Questions"),
      b("Should we build a review reply API (brand response to shoppers)? Nykaa has requested. Estimate: 8 weeks. Decision needed by July 31."),
      b("How do we handle AI-generated review summary hallucinations? Pilot with Haiku flagged 3% false summaries. Need human fallback strategy."),
    ],
  },
  {
    title: "Product: Visual UGC",
    pm: "Rohan Verma",
    stage: "GA · Expanding to Video",
    arr: "₹5.2 Cr ARR",
    blocks: [
      call("PM: Rohan Verma · Engineering Lead: Aditi Mishra · Stage: GA (Photo) · Beta (Video) · ARR: ₹5.2 Cr", "📸"),
      h2("What it does"),
      p("Enables brands to collect, moderate, and display photo and (upcoming) video reviews from customers. Integrates with Ratings & Reviews API — photos are attached to reviews. Nykaa uses it to display customer selfies on product pages, driving 23% higher conversion."),
      h2("Current Status — Photo UGC"),
      b("Live with 12 enterprise clients. Nykaa and boAt are power users."),
      b("Auto-moderation: AI flags NSFW content, brand safety issues, off-topic photos"),
      b("Gallery widget: Embeds into brand PDPs, mobile-responsive"),
      b("Monthly photo volume: 340,000 photos processed"),
      h2("Video UGC — In Development (Q3 2026 Target)"),
      b("Architecture: Upload → S3 → Lambda transcoding → Bedrock content moderation → CDN delivery"),
      b("Video length supported: Up to 60 seconds"),
      b("Committed to: boAt (contract expansion pending GA) and Nykaa (expansion discussion)"),
      b("boAt pilot: Starting July 1, 2026. CSAT target: ≥ 4.0/5"),
      b("P99 processing latency target: < 90 seconds for 60s clips"),
      h2("H2 2026 Roadmap"),
      n("Video UGC GA — Q3 2026"),
      n("AI video highlights: Auto-clip 15s highlight from 60s video for PDP thumbnails — Q4 2026"),
      n("Influencer Hub integration: Tag influencer-created UGC separately — Q4 2026"),
      n("Accessibility: Auto-captions for video reviews — Q4 2026 (WCAG 2.1 compliance)"),
      h2("Key Decisions"),
      b("Decision (April 2026): Chose AWS Bedrock for video content moderation over custom ML — faster time-to-market, managed service. Approved by Rahul Sharma (CTO). Trade-off: higher cost per video vs in-house. Will revisit at 1M videos/month."),
      b("Decision (Feb 2026): capped video at 60 seconds based on boAt user research — reviewers don't watch longer videos. Rohan Verma decision, Arjun Kapoor approved."),
    ],
  },
  {
    title: "Product: Review Engine",
    pm: "Kavitha Nair",
    stage: "GA · ML-Powered",
    arr: "₹3.8 Cr ARR",
    blocks: [
      call("PM: Kavitha Nair · ML Lead: Dr. Ankit Jain · Stage: GA · ARR: ₹3.8 Cr", "🔬"),
      h2("What it does"),
      p("The intelligence layer on top of raw reviews. Runs ML quality scoring, authenticity checks, sentiment analysis, and keyword extraction on every incoming review. Powers the moderation queue prioritisation and the Analytics Dashboard insights."),
      h2("ML Models in Production"),
      b("Quality Scorer v2: Scores each review 0–100 on helpfulness (length, specificity, detail). Trained on 2.4M human-rated reviews."),
      b("Authenticity Detector: Flags suspicious reviews (bot patterns, velocity, IP clustering). FPR: 0.8%, FNR: 2.1%."),
      b("Sentiment Analyser: 3-class (positive/neutral/negative) per review + per sentence. Accuracy: 91.3%."),
      b("Topic Extractor: Identifies key product attributes mentioned (battery life, packaging, scent, etc.) per category."),
      h2("H2 2026 Roadmap"),
      n("Quality Scorer v3: Incorporate image quality signals (blur, off-topic photos) — August 2026"),
      n("Multilingual sentiment: Hindi, Tamil, Telugu support — October 2026"),
      n("Competitive benchmarking signals: Feed Review Engine scores into Retail Intelligence product — September 2026"),
      n("Real-time scoring API: Sub-100ms quality score on review submission (currently async) — November 2026"),
      h2("Key Decisions"),
      b("Decision (May 2026): Switched moderation from Claude Sonnet to Claude Haiku after A/B test showed <0.5% quality difference at 65% cost saving. Approved by Rahul Sharma (CTO) and Ananya Singh (CFO). Owner: Swati Gupta (Moderation Suite PM)."),
      b("Decision (March 2026): Kept authenticity detection in-house rather than adopting Sift Science. Reason: Sift required sending raw review text off-platform — 3 BFSI clients (HDFC, Axis, ICICI prospects) have contractual prohibitions. Decision owner: Kavitha Nair, approved by Arjun Kapoor."),
    ],
  },
  {
    title: "Product: Syndication Platform",
    pm: "Aditya Patel",
    stage: "GA",
    arr: "₹4.1 Cr ARR",
    blocks: [
      call("PM: Aditya Patel · Stage: GA · ARR: ₹4.1 Cr · Key account: Myntra, Walmart India", "🔄"),
      h2("What it does"),
      p("Distributes brand-collected reviews from manufacturer sites to retailer product pages across the Apex network. A brand collects reviews on their own site → Apex syndicates them to Walmart India, Myntra, Flipkart, Croma simultaneously — giving shoppers more reviews everywhere they shop."),
      h2("Network Size"),
      b("23 brand sources (manufacturers and D2C brands)"),
      b("11 retail destinations (Walmart India, Nykaa, Myntra, Flipkart, Croma, etc.)"),
      b("Monthly syndicated reviews: 1.1M"),
      b("Avg time-to-syndication: 4.2 hours (target: < 2 hours by Q4 2026)"),
      h2("H2 2026 Roadmap"),
      n("Real-time syndication (< 15 min): Myntra committed requirement. Due Q3 2026."),
      n("Video review syndication: Extend to support Visual UGC video clips — Q4 2026"),
      n("Southeast Asia destinations: Tokopedia + Shopee integration — Q4 2026 (strategy alignment)"),
      n("Syndication analytics: Show brands which destination drives most conversions — Q3 2026"),
      h2("Key Decisions"),
      b("Decision (Jan 2026): Built custom transformation layer instead of adopting Bazaarvoice Syndication API. Reason: BV charges per review syndicated at scale; our in-house cost is 80% cheaper. Approved by Ananya Singh (CFO). Owner: Aditya Patel."),
      b("Decision (April 2026): Deprioritised Amazon India integration in H1 2026. Amazon requires AMS partnership review (6-month process). Pushed to H1 2027."),
    ],
  },
  {
    title: "Product: Q&A Module",
    pm: "Shruti Agarwal",
    stage: "GA",
    arr: "₹1.8 Cr ARR",
    blocks: [
      call("PM: Shruti Agarwal · Stage: GA · ARR: ₹1.8 Cr", "❓"),
      h2("What it does"),
      p("Allows shoppers to ask product questions on brand or retailer pages. Questions are routed to: (1) existing reviews for AI-generated answers, (2) the brand's team for manual answers, or (3) the community of verified purchasers. Reduces pre-purchase friction and increases conversion."),
      h2("Key Metrics"),
      b("Question-to-answer rate: 78% (industry avg: 52%)"),
      b("AI-answered rate: 43% (no human needed)"),
      b("Avg response time: 3.2 hours for human-answered"),
      b("Conversion lift for pages with Q&A: +11% (Nykaa A/B test, Q1 2026)"),
      h2("H2 2026 Roadmap"),
      n("AI answer quality v2: Fine-tuned on product category-specific knowledge — Q3 2026"),
      n("Brand moderation dashboard: Let brands answer and manage Q&A in Brand Portal — Q3 2026"),
      n("Multi-language Q&A: Hindi support — Q4 2026"),
      n("Q&A analytics: Most common questions by product category → feeds Analytics Dashboard — Q4 2026"),
      h2("Key Decisions"),
      b("Decision (Feb 2026): AI-generated answers will not be shown without a 'Powered by AI' label — legal requirement and brand trust decision. Priya Mehta (CPO) decision, June 2025."),
      b("Decision (March 2026): Community answer feature deprioritised for H1. Low engagement in pilot (only 12% of users eligible answered). Shruti Agarwal + Arjun Kapoor agreed to push to H2."),
    ],
  },
  {
    title: "Product: Social Commerce",
    pm: "Manish Kumar",
    stage: "Beta",
    arr: "₹0.9 Cr ARR",
    blocks: [
      call("PM: Manish Kumar · Stage: Beta · ARR: ₹0.9 Cr · P1 product", "📱"),
      h2("What it does"),
      p("Connects Apex review content with social commerce channels — Instagram Shopping, TikTok Shop, and WhatsApp Commerce. Brands can push top-rated reviews and UGC directly to social product listings, and import social comments back into Apex for moderation and analytics."),
      h2("Current Beta Status"),
      b("3 beta clients: boAt (Instagram Shopping), Mamaearth (WhatsApp Commerce), Nykaa (Instagram Shopping)"),
      b("Instagram Shopping integration: Live, pulling review stars into Instagram product tags"),
      b("WhatsApp Commerce: In development, Mamaearth pilot Q3 2026"),
      b("TikTok Shop: Scoping only — TikTok India regulatory situation under watch"),
      h2("H2 2026 Roadmap"),
      n("Instagram Shopping GA — July 2026"),
      n("WhatsApp Commerce beta with Mamaearth — August 2026"),
      n("Social UGC import: Pull Instagram tagged posts into Visual UGC gallery — Q4 2026"),
      n("TikTok Shop: Pause pending regulatory clarity — revisit Q1 2027"),
      h2("Key Decisions"),
      b("Decision (May 2026): Paused TikTok Shop integration indefinitely. India regulatory environment around TikTok remains unclear. Vikram Nair and Rahul Sharma decision. Revisit Q1 2027."),
      b("Decision (April 2026): WhatsApp Commerce chosen over SMS for D2C brands — WhatsApp open rate 94% vs SMS 35% in India. Manish Kumar analysis, Priya Mehta approved."),
    ],
  },
  {
    title: "Product: Influencer Hub",
    pm: "Pooja Iyer",
    stage: "Beta",
    arr: "₹0.7 Cr ARR",
    blocks: [
      call("PM: Pooja Iyer · Stage: Beta · ARR: ₹0.7 Cr · Target: GA Q4 2026", "🌟"),
      h2("What it does"),
      p("Platform for brands to manage creator campaigns that generate authentic UGC. Brands brief creators, creators submit content (photos/videos), content is moderated and tagged as 'Creator Review' vs organic review, then published with appropriate disclosure labels."),
      h2("Current Beta"),
      b("2 beta clients: Mamaearth (creator skincare reviews), boAt (unboxing videos)"),
      b("Creator network: 840 verified creators in database, invite-only"),
      b("Avg campaign: 50 creators, 180 pieces of content, 28-day turnaround"),
      h2("H2 2026 Roadmap"),
      n("Creator marketplace: Brands can browse and invite creators — Q3 2026"),
      n("FTC disclosure automation: Auto-labels sponsored content per regulation — Q3 2026 (legal requirement)"),
      n("Mamaearth creator data integration: Import their existing creator roster — Q4 2026"),
      n("Performance analytics: ROI tracking per creator campaign — Q4 2026"),
      h2("Key Decisions"),
      b("Decision (March 2026): All influencer content must be labelled 'Sponsored Review' in the widget — no exceptions. Legal requirement. Priya Mehta and legal team decision. Non-negotiable."),
      b("Decision (April 2026): Dropped 'micro-influencer auto-matching' from scope. Algorithm was matching irrelevant creators in 30% of cases. Pooja Iyer deprioritised after Arjun Kapoor review. Will revisit after creator dataset reaches 5,000."),
    ],
  },
  {
    title: "Product: Sampling & Advocacy",
    pm: "Karan Mehta",
    stage: "GA",
    arr: "₹2.1 Cr ARR",
    blocks: [
      call("PM: Karan Mehta · Stage: GA · ARR: ₹2.1 Cr", "📦"),
      h2("What it does"),
      p("Enables brands to send product samples to selected advocates — shoppers who've opted in — in exchange for verified reviews. Manages the full workflow: advocate selection, sample fulfillment coordination, review collection post-receipt, and analytics on review quality vs. organic."),
      h2("Key Metrics"),
      b("Review collection rate post-sample: 67% (industry benchmark: 45%)"),
      b("Sampled review quality score: 84/100 avg (vs 71/100 for organic)"),
      b("Active campaigns: 18 running across 9 brands"),
      b("Top client: Himalaya — 3 campaigns running. Risk: Himalaya downgraded account, may pause campaigns."),
      h2("H2 2026 Roadmap"),
      n("Automated advocate scoring: Use Review Engine signals to score advocate quality before selection — Q3 2026"),
      n("Fulfilment API integration: Connect to Shiprocket/Delhivery for automated sample dispatch — Q3 2026"),
      n("Campaign analytics v2: Show brands review quality by advocate tier — Q4 2026"),
      n("Enterprise tier: Priority campaign processing, dedicated advocate pool for ₹50 Cr+ brands — Q4 2026"),
      h2("Key Decisions"),
      b("Decision (Feb 2026): Advocates must disclose they received a sample — mandatory in review submission flow. Legal and FTC compliance. Non-negotiable. Karan Mehta and Priya Mehta."),
      b("Decision (May 2026): Himalaya account flagged as churn risk. Paused new campaign features for their account until renewal confirmed. Karan Mehta coordinating with Sandeep Gupta."),
    ],
  },
  {
    title: "Product: Loyalty & Rewards",
    pm: "Divya Sharma",
    stage: "Beta",
    arr: "₹0.5 Cr ARR",
    blocks: [
      call("PM: Divya Sharma · Stage: Beta · ARR: ₹0.5 Cr · Target: GA Q1 2027", "🏆"),
      h2("What it does"),
      p("Incentivises authentic reviews through a points and rewards system. Shoppers earn points for submitting reviews — redeemable as brand vouchers, discount codes, or cashback. Integrates with brand loyalty programmes (Nykaa Pink, boAt Tribe) via API."),
      h2("Why We're Building This"),
      p("Review volume is the #1 request from enterprise clients who have high review abandonment rates. Nykaa sees 78% of shoppers who start a review abandon before submitting. Loyalty incentive increases completion rate to 61% in pilot."),
      h2("H2 2026 Roadmap"),
      n("Nykaa Pink integration: Map Apex points to Nykaa's loyalty currency — Q3 2026"),
      n("Fraud detection for rewards: Prevent fake reviews for points abuse — Q3 2026 (critical)"),
      n("boAt Tribe integration — Q4 2026"),
      n("GA launch with 3 foundation clients — Q1 2027"),
      h2("Key Decisions"),
      b("Decision (April 2026): Points are non-transferable and can only be redeemed on the same brand — prevents a secondary market. Divya Sharma and Ananya Singh (CFO) decision."),
      b("Decision (March 2026): Minimum review length of 50 words to earn points. Prevents single-word reviews gaming the system. Quality gate enforced by Review Engine."),
    ],
  },
  {
    title: "Product: Analytics Dashboard",
    pm: "Ravi Krishnan",
    stage: "GA · Free tier · Paid tier launching Q3 2026",
    arr: "₹1.2 Cr ARR (growing rapidly)",
    blocks: [
      call("PM: Ravi Krishnan · Stage: GA (free) · Paid tier Q3 2026 · Strategic upsell anchor", "📊"),
      h2("What it does"),
      p("Intelligence layer for all Apex products. Shows brands trends in ratings, sentiment, review volume, Q&A topics, UGC performance, and competitive benchmarking (paid tier). The dashboard is the single place where a brand's Head of eCommerce gets their weekly product intelligence digest."),
      h2("Current State"),
      b("All enterprise customers have access to free tier"),
      b("Free tier: 30-day lookback, basic sentiment, review volume trends, top keywords"),
      b("Paid tier (Q3 2026): 12-month lookback, competitive benchmarking, AI weekly digest email, custom alerts, data export API"),
      b("DAU: 138 users (from 47 enterprise clients). Engagement: 3.2 sessions/user/week"),
      h2("H2 2026 Roadmap"),
      n("Paid tier launch — Q3 2026 (target ₹3 Cr ARR from upsell by Dec 2026)"),
      n("Analytics Export API < 1s latency — August 2026 (committed to Walmart India)"),
      n("AI weekly digest: Claude-generated insight email every Monday — Q3 2026"),
      n("Custom alerts: Brand sets threshold (e.g. rating drops below 3.8) → instant notification — Q3 2026"),
      n("Retail Intelligence integration: Competitive benchmarking data feeds into dashboard — Q4 2026"),
      h2("Key Decisions"),
      b("Decision (Jan 2026): Analytics Dashboard is the upsell anchor for FY2026 — approved by Vikram Nair and Priya Mehta in January strategy session. Every new enterprise contract now includes Analytics free tier by default."),
      b("Decision (April 2026): Paid tier pricing: ₹2.5 L/year for analytics-only, ₹4 L/year bundled with any other Apex product. Approved by Ananya Singh (CFO) and Sandeep Gupta (VP Sales)."),
      b("Decision (May 2026): Export API SLA: < 1 second for up to 10,000 rows. > 10,000 rows is async export to email. Ravi Krishnan decision, committed to Walmart India by Sandeep Gupta."),
    ],
  },
  {
    title: "Product: Moderation Suite",
    pm: "Swati Gupta",
    stage: "GA · Embedded in all products",
    arr: "Included in platform ARR",
    blocks: [
      call("PM: Swati Gupta · ML Lead: Dr. Ankit Jain · Stage: GA · Cross-product dependency", "🛡️"),
      h2("What it does"),
      p("Content moderation for all user-generated content across the Apex platform. Handles profanity, spam, NSFW content, competitor brand attacks, legal risk flagging, and brand safety. Runs on every review, photo, video, and Q&A submission."),
      h2("Architecture"),
      b("Layer 1 (automated, ~95% of volume): Claude Haiku — fast, cheap, catches clear violations"),
      b("Layer 2 (flagged content, ~4% of volume): Claude Sonnet — nuanced judgement on borderline cases"),
      b("Layer 3 (escalations, ~1% of volume): Human moderators — legal risk, brand crises, sensitive cases"),
      b("Custom rules engine: Brands can add their own keyword blocklists and category rules"),
      h2("H2 2026 Roadmap"),
      n("Custom moderation rules UI: Brand Portal self-serve rules management — Q3 2026 (committed to Myntra)"),
      n("Multilingual moderation: Hindi, Tamil, Telugu — Q4 2026"),
      n("Video content moderation: Extend to Visual UGC video pipeline — Q3 2026"),
      n("Moderation analytics: False positive/negative rate by category and brand — Q3 2026"),
      h2("Key Decisions"),
      b("Decision (May 2026): Switched from Claude Sonnet to Haiku for Layer 1. Cost: ₹0.22 → ₹0.09/review. Quality impact: False positive rate increased from 1.2% to 1.8% — within acceptable range. Approved by Rahul Sharma (CTO). Owner: Swati Gupta."),
      b("Decision (April 2026): Human moderation SLA = 4 hours for escalations. Previously 24 hours. Changed after Nykaa complained about a brand-damaging review sitting live for 18 hours. Priya Mehta directive."),
    ],
  },
  {
    title: "Product: Brand Portal",
    pm: "Amit Sinha",
    stage: "GA · Self-serve",
    arr: "Enables all ARR",
    blocks: [
      call("PM: Amit Sinha · Stage: GA · This is the brand's primary interface to all Apex products", "🏪"),
      h2("What it does"),
      p("The self-serve web dashboard where brand and retail clients manage everything: view and respond to reviews, manage UGC campaigns, configure widgets, access analytics, and set moderation rules. Primary surface for day-to-day brand users (not the API buyer)."),
      h2("Current State"),
      b("47 enterprise clients use Brand Portal daily"),
      b("DAU: 210 brand users (avg 4.5 per enterprise client)"),
      b("NPS from Brand Portal specifically: 48"),
      b("Most used feature: Review queue management (94% of users weekly)"),
      b("Least used feature: Bulk export (8% of users — most use API instead)"),
      h2("H2 2026 Roadmap"),
      n("Q&A Management panel: Let brands answer shopper questions in-portal — Q3 2026"),
      n("Custom moderation rules UI for Myntra — Q3 2026 (committed feature)"),
      n("SSO integration: Brands log in with their own SSO instead of Apex credentials — pending Enterprise SSO GA (July 2026)"),
      n("Mobile-responsive redesign: 31% of brand users access on mobile — Q4 2026"),
      n("Bulk operations: Select 50 reviews, approve/reject in one click — Q4 2026"),
      h2("Key Decisions"),
      b("Decision (March 2026): Moved from Angular to React for Brand Portal frontend. Reason: all new engineering hires are React-first; Angular expertise was a hiring bottleneck. Deepa Reddy and Amit Sinha decision."),
      b("Decision (April 2026): Mobile app for brand users deprioritised — usage data shows 31% mobile access is read-only (viewing analytics). All write actions happen on desktop. Mobile web is sufficient for now."),
    ],
  },
  {
    title: "Product: Retail Intelligence",
    pm: "Priyanka Jain",
    stage: "Beta",
    arr: "₹0.6 Cr ARR",
    blocks: [
      call("PM: Priyanka Jain · Stage: Beta · Target GA: Q1 2027 · Strategic product", "🔍"),
      h2("What it does"),
      p("Competitive benchmarking for brands. Shows how a brand's review score compares to competitors on the same retailer page — by category, product, and attribute. Sources: publicly available review data from Apex network retailers."),
      h2("Why This Matters"),
      p("Brands currently have no way to know if their 4.2 rating on Walmart India is above or below category average. With Retail Intelligence, they see: 'You're 0.4 stars below category average on battery life — you're losing to OnePlus and Samsung on this attribute.'"),
      h2("Beta Status"),
      b("3 beta clients: boAt, Mamaearth, Himalaya"),
      b("Categories covered: Consumer electronics, skincare, health supplements"),
      b("Data refresh: Daily (planning real-time in H2 2026)"),
      h2("H2 2026 Roadmap"),
      n("Analytics Dashboard integration: Feed benchmarking data into Analytics paid tier — Q4 2026"),
      n("Attribute-level benchmarking: Compare 'battery life' score vs competitors — Q3 2026"),
      n("Automated alerts: Notify when a competitor overtakes you on a key attribute — Q4 2026"),
      n("GA launch: Q1 2027, priced as Analytics paid tier add-on"),
      h2("Key Decisions"),
      b("Decision (Feb 2026): Only use publicly available, Apex-network review data for benchmarking. No web scraping of third-party platforms — legal flagged this as Terms of Service violation risk. Priyanka Jain and legal, approved by Rahul Sharma."),
    ],
  },
  {
    title: "Product: Search & Discovery",
    pm: "Aakash Rao",
    stage: "Beta",
    arr: "₹0.4 Cr ARR",
    blocks: [
      call("PM: Aakash Rao · Stage: Beta · Target GA: Q2 2027", "🔎"),
      h2("What it does"),
      p("AI-powered search within brand review databases. Shoppers on brand or retailer pages can search 'battery life reviews' or 'reviews mentioning fast delivery' and get semantically matched results from the review corpus. Powered by Voyage AI embeddings on the review text."),
      h2("Why Now"),
      p("Top brands (Nykaa, boAt) have 50,000+ reviews per product category. Native keyword search misses semantic queries. Voyage AI embeddings on review text enable semantic search that understands 'it lasted all day' = 'good battery life'."),
      h2("Beta Status"),
      b("2 beta clients: Nykaa (beauty search), boAt (electronics)"),
      b("Embedding model: Voyage voyage-3-lite (512 dims) — same as Seam's own pipeline"),
      b("Latency: P99 180ms for semantic search across 50K reviews"),
      b("Relevance score: 4.3/5 human evaluation on 100 test queries"),
      h2("H2 2026 Roadmap"),
      n("Review search widget: Embeddable search bar for brand PDPs — Q3 2026"),
      n("Natural language filter: 'Show me 5-star reviews about packaging' → structured filter — Q3 2026"),
      n("Search analytics: What do shoppers search for that they can't find? → feeds product decisions — Q4 2026"),
      h2("Key Decisions"),
      b("Decision (March 2026): Chose Voyage AI over OpenAI embeddings — better performance on product attribute queries in A/B test (Aakash Rao ran internal benchmark). Consistent with Seam's own embedding choice."),
    ],
  },
  {
    title: "Product: Checkout Optimization",
    pm: "Meera Nambiar",
    stage: "Beta",
    arr: "₹0.3 Cr ARR",
    blocks: [
      call("PM: Meera Nambiar · Stage: Beta · Target GA: Q3 2026", "🛒"),
      h2("What it does"),
      p("Injects review signals (star rating, review count, top review snippet) directly into the checkout flow — add-to-cart page, cart, and payment page. Shows shoppers social proof at the moment of highest purchase intent, reducing cart abandonment."),
      h2("Conversion Impact"),
      b("Nykaa A/B test (Feb 2026): +8% checkout completion rate when review snippet shown on cart page"),
      b("Myntra pilot: +5% add-to-cart rate when star rating shown on product listing"),
      h2("H2 2026 Roadmap"),
      n("Myntra checkout integration GA — Q3 2026"),
      n("Personalized review snippet: Show the review most relevant to this shopper (based on past purchase) — Q4 2026"),
      n("WhatsApp cart recovery: Send review snippet in abandoned cart WhatsApp message — Q4 2026"),
      h2("Key Decisions"),
      b("Decision (April 2026): Will not show review count below 5 reviews in checkout — creates negative social proof effect. Meera Nambiar decision backed by Nykaa data: pages with 1–4 reviews had lower conversion than no reviews shown."),
    ],
  },
  {
    title: "Product: Review Widgets",
    pm: "Suresh Pillai",
    stage: "GA · Core embedding layer",
    arr: "Included in platform contracts",
    blocks: [
      call("PM: Suresh Pillai · Stage: GA · Core: every enterprise client uses widgets", "🧩"),
      h2("What it does"),
      p("JavaScript widgets that embed Apex review content into brand and retailer websites. Includes: star rating summary, full review list, photo gallery, Q&A panel, and review submission form. Loaded asynchronously with < 50ms TTI impact."),
      h2("Current State"),
      b("47 enterprise clients use at least one widget"),
      b("Weekly widget loads: 18.4 million"),
      b("Performance: P99 load time 320ms, TTI impact < 50ms"),
      b("Accessibility: WCAG 2.1 AA compliant"),
      h2("H2 2026 Roadmap"),
      n("Widget Studio: No-code customization of widget colours, fonts, layout in Brand Portal — Q3 2026"),
      n("Web Components standard: Migrate from iFrame to Web Components for better SEO and styling control — Q4 2026"),
      n("AMP support: Accelerated Mobile Pages widget variant for news/editorial placements — Q4 2026"),
      h2("Key Decisions"),
      b("Decision (Feb 2026): Keeping iFrame architecture for now — migration to Web Components is 12 weeks of work and 47 clients would need to re-embed. Suresh Pillai + Arjun Kapoor agreed Web Components is right but timing is Q4 2026."),
    ],
  },
  {
    title: "Product: Content Distribution",
    pm: "Anjali Malhotra",
    stage: "GA",
    arr: "₹1.5 Cr ARR",
    blocks: [
      call("PM: Anjali Malhotra · Stage: GA · ARR: ₹1.5 Cr", "📡"),
      h2("What it does"),
      p("Omnichannel publishing of review content. Beyond Syndication (retailer-to-retailer), Content Distribution pushes review snippets, ratings, and UGC to: email campaigns, Google Shopping (structured data), Meta catalogue, and offline digital signage via API."),
      h2("Current Channels"),
      b("Google Shopping: Structured data schema for review stars in search results. 23 brands active."),
      b("Meta Product Catalogue: Syncs review count and rating to Meta catalogue for Facebook/Instagram Shopping ads. 15 brands."),
      b("Email: Review snippet templates for ESP integration (Mailchimp, Klaviyo). 18 brands."),
      b("Digital Signage API: Retail stores display live review data on screens. 4 brands."),
      h2("H2 2026 Roadmap"),
      n("WhatsApp Business integration: Push review content to WhatsApp catalogue — Q3 2026"),
      n("Google Seller Ratings: Feed aggregate ratings to Google Merchant Centre — Q3 2026"),
      n("Offline QR codes: Generate QR codes linking to review page for packaging — Q4 2026"),
      h2("Key Decisions"),
      b("Decision (Jan 2026): Chose structured data approach for Google Shopping over Google's proprietary API — structured data is stable, free, and requires no Google partnership approval. Anjali Malhotra decision."),
    ],
  },
  {
    title: "Product: Competitor Benchmarking",
    pm: "Rajesh Tiwari",
    stage: "Alpha — internal only",
    arr: "₹0 (planned ₹2 Cr ARR at GA)",
    blocks: [
      call("PM: Rajesh Tiwari · Stage: Alpha · Target: feed into Retail Intelligence + Analytics Dashboard paid tier", "⚔️"),
      h2("What it does"),
      p("Tracks competitors' review scores, volume, and sentiment trends across Apex network retailers. Internal tool currently — will become a feature of Retail Intelligence and Analytics Dashboard paid tier. Brands see: 'Your category average is 4.1. Top performer is boAt at 4.6. Here's what they do differently.'"),
      h2("Data Sources"),
      b("Apex Syndication Network: Reviews from 23 brand sources across 11 retail destinations"),
      b("Scope: Only data that flows through the Apex network — no web scraping"),
      h2("H2 2026 Roadmap"),
      n("Analytics Dashboard integration: Benchmarking tab in paid tier — Q4 2026"),
      n("Retail Intelligence integration — Q4 2026"),
      n("Automated competitive alerts: 'Competitor overtook you on battery life score' — Q1 2027"),
      h2("Key Decisions"),
      b("Decision (March 2026): NO web scraping of external platforms. Legal flagged ToS violation risk. Only Apex network data is in scope. Rajesh Tiwari + Priyanka Jain + legal sign-off. Non-negotiable."),
      b("Decision (April 2026): Competitor data shown at category level only (not individual brand names) in shared dashboards — prevents one Apex client from reverse-engineering another's review strategy. Privacy boundary set by Priya Mehta."),
    ],
  },
  {
    title: "Product: API Developer Portal",
    pm: "Ishaan Chandra",
    stage: "In development · Target Q4 2026",
    arr: "₹0 (planned +₹3 Cr via channel partners)",
    blocks: [
      call("PM: Ishaan Chandra · Stage: In development · GA: Q4 2026 · Strategic: new channel partner revenue", "⚙️"),
      h2("What it does"),
      p("Self-serve developer portal for API access to Apex Commerce platform. Includes: interactive API docs, SDK downloads (Node.js, Python, Java), sandbox environment with test data, API key management, usage dashboard, and webhook testing tools."),
      h2("Why Now"),
      p("Currently every API integration requires 2–4 weeks of Apex engineering involvement. The Developer Portal enables third-party developers (system integrators, channel partners, SMB developers) to self-onboard without Apex engineering. 3 channel partners signed LOI pending portal launch."),
      h2("H2 2026 Roadmap"),
      n("API documentation site (docs.apexcommerce.io) — Q3 2026"),
      n("Interactive API explorer (try API calls in browser) — Q3 2026"),
      n("Node.js and Python SDKs — Q4 2026"),
      n("Sandbox with synthetic review data — Q4 2026"),
      n("Webhook testing tool (like Stripe CLI for webhooks) — Q4 2026"),
      n("GA launch + 3 channel partner onboarding — Q4 2026"),
      h2("Key Decisions"),
      b("Decision (Feb 2026): Chose Redocly for docs infrastructure over Stoplight — Redocly supports auto-generation from OpenAPI spec and has better search. Ishaan Chandra decision."),
      b("Decision (March 2026): Free tier API access (500 calls/day) for developers to build and test — no credit card required. Conversion to paid expected at 8% based on comparable dev portals. Approved by Sandeep Gupta (VP Sales) and Ananya Singh (CFO)."),
    ],
  },
  {
    title: "Product: Enterprise SSO & Admin",
    pm: "Tanvi Bhatt",
    stage: "In development · GA July 30, 2026 (4 weeks late)",
    arr: "Unblocks ₹6.5 Cr ARR expansion across 11 deals",
    blocks: [
      call("PM: Tanvi Bhatt · Engineering: Deepa Reddy (priority) · GA: July 30, 2026 · P0 blocker for 11 enterprise deals", "🔐"),
      h2("What it does"),
      p("Enterprise-grade identity and access management for Apex Commerce. SSO support for Google Workspace, Okta, and Azure AD. Role-based access control (RBAC): Admin, PM, Analyst, Read-only. Audit log of all user actions. User provisioning via SCIM 2.0."),
      h2("Why P0"),
      p("11 enterprise clients (Walmart India, Nykaa, Myntra, Flipkart, Croma, HDFC, and 5 pipeline deals) have made Enterprise SSO a contractual requirement before expanding. Without it, combined ₹6.5 Cr ARR expansion is blocked."),
      h2("Current Status"),
      b("Development: 80% complete as of June 2026"),
      b("SSO providers completed: Google Workspace, Okta"),
      b("SSO providers in progress: Azure AD (needed for Walmart India IT policy)"),
      b("SCIM 2.0: 60% complete"),
      b("GA target: July 30, 2026 — 4 weeks behind original plan (June 30)"),
      b("Deepa Reddy reassigning 2 engineers from Sampling team to accelerate"),
      h2("H2 2026 Roadmap"),
      n("GA: Google Workspace + Okta + Azure AD SSO — July 30, 2026"),
      n("SCIM 2.0 user provisioning — August 2026"),
      n("Advanced RBAC: Custom role builder — Q4 2026"),
      n("SOC 2 Type II audit with SSO included — Q4 2026"),
      h2("Key Decisions"),
      b("Decision (May 2026): Deprioritised custom role builder for GA. Predefined roles (Admin/PM/Analyst/Read-only) sufficient for initial launch. Custom roles pushed to Q4 2026. Tanvi Bhatt and Arjun Kapoor agreed — ship GA first, customise later."),
      b("Decision (June 2026): Azure AD is in scope for GA after Walmart India confirmed it as hard requirement. Originally planned as Q3 feature. Deepa Reddy approved additional engineer allocation. Tanvi Bhatt owns the timeline."),
      b("Risk: If Azure AD slips, Walmart India GA access is delayed. Contingency: Offer Walmart India Google SSO as interim option while Azure AD completes."),
    ],
  },
];

// ── Slack channel messages ─────────────────────────────────────────────────────

const SLACK_CHANNELS: Record<string, { channel: string; messages: string[] }> = {

  "strategy-decisions": {
    channel: "#strategy-decisions",
    messages: [
      `**Vikram Nair (CEO)** — January 15, 2026
Sharing the FY2026 strategy theme that was aligned in today's board session: *From Feature Provider to Commerce Intelligence Platform.*

The core shift: we stop selling point solutions and start selling the platform. Analytics Dashboard is the upsell anchor. Every enterprise contract now includes it by default.

Five strategic bets for the year:
1. Analytics Dashboard as upsell anchor → target ₹8 Cr new ARR
2. Video UGC expansion → ₹5 Cr new ARR (Nykaa + boAt pre-committed)
3. API Developer Portal → ₹3 Cr via channel partners
4. Southeast Asia entry (Singapore-first) → ₹2 Cr
5. Enterprise SSO GA → unblocks ₹6.5 Cr stalled expansion

What we're NOT doing this year: Shopify plugin, mobile consumer app, social listening. If you get asked about these, the answer is "FY2027 at earliest."`,

      `**Priya Mehta (CPO)** — February 3, 2026
Following up on the strategy session — three product-level decisions I'm locking in for H1:

1. **SSO is P0.** Tanvi Bhatt's team gets whatever engineering they need. Deepa is reallocating 2 engineers from Sampling. This is the single most important thing we can ship for revenue.

2. **Analytics Dashboard paid tier pricing approved** — ₹2.5 L/year standalone, ₹4 L/year bundled. Ananya signed off. Ravi — launch target is Q3, not Q2. We need the competitive benchmarking data feed from Retail Intelligence ready first.

3. **LLM cost OKR is real.** Swati — I need the Haiku switch for moderation Layer 1 complete by May 1. Ankit — run the A/B test and get me the false positive numbers before we fully commit. If FPR goes above 3%, we pause.

Full OKRs document is in Notion — search "H1 2026 OKRs" in Seam.`,

      `**Rahul Sharma (CTO)** — May 22, 2026
LLM cost update: Haiku migration for Layer 1 moderation is complete as of May 20.

Numbers:
- Cost per review: ₹0.22 → ₹0.09 (59% reduction, target was 65% — close enough)
- False positive rate: 1.2% → 1.8% (within Priya's 3% threshold)
- Zero impact on Layer 2/3 pipeline

We're still not at the ₹0.08/review target from the OKR. The remaining gap is in the video moderation pipeline where Sonnet is handling transcription + moderation together. Swati is working on splitting the pipeline — transcription stays Sonnet, moderation moves to Haiku. That gets us to ~₹0.065/review.

Risk: LLM volume is growing 11% MoM (more brands, more reviews). Even at Haiku pricing, if volume grows 3x in 12 months, we're back to the same cost. Need to watch this.`,

      `**Vikram Nair (CEO)** — June 10, 2026
Board update on H1 performance (mid-year):

ARR: ₹38 Cr vs ₹42 Cr target. Behind by ₹4 Cr.
Root cause: Analytics Dashboard paid tier slipped from Q2 to Q3 (Ravi's update below). SSO delay also held back expansion conversations with Nykaa and Walmart India.

What's on track:
- Video UGC: boAt pilot July 1, on track for Q3 GA
- LLM costs: 59% reduction achieved
- Enterprise churn: 94% retention (better than 96% target last quarter, Himalaya downgrade hurts)

Guidance for H2: We need to close the ARR gap in Q3. Analytics paid tier launch is the single biggest lever. Ravi — this cannot slip again. SSO GA in July + Analytics in Q3 = we recover.`,

      `**Arjun Kapoor (Group PM)** — June 18, 2026
Myntra risk escalation — flagging for Priya, Vikram, Sandeep.

Aditya Bose (Myntra Head of Content Tech) told me in our quarterly review that they're evaluating Yotpo as an alternative. Specifically: they want real-time review syndication (< 15 min) and we're currently at 4.2 hours.

Sandeep — can you get a call with Aditya this week? We need to commit to real-time syndication by Q3. Aditya Patel (Syndication PM) confirmed it's buildable in 6 weeks with current team.

If we lose Myntra it's ₹1.9 Cr ARR — and a reference customer for any future retail chain deals.

Recommend: Commit to real-time syndication by August 31. Aditya Patel to start sprint immediately.`,
    ],
  },

  "product-roadmap": {
    channel: "#product-roadmap",
    messages: [
      `**Arjun Kapoor (Group PM)** — April 5, 2026
H2 2026 roadmap summary — things we're committed to and why:

**Committed to enterprise clients (non-negotiable):**
- Enterprise SSO GA (July 30) → 11 deals waiting. Tanvi owns.
- Real-time syndication for Myntra (August 31) → Myntra at risk. Aditya Patel owns.
- Analytics Export API < 1s (August 15) → Walmart India committed. Ravi owns.
- Analytics paid tier launch (Q3) → primary ARR lever for H2. Ravi owns.
- Video UGC GA (Q3) → boAt contract expansion pending. Rohan owns.
- Custom moderation rules for Myntra (Q3) → committed. Swati owns.

**Bets (important but not committed):**
- API Developer Portal (Q4) → channel partner revenue
- Influencer Hub GA (Q4) → Mamaearth interest
- Southeast Asia entry (Q4) → Singapore pilot with Tokopedia

**Explicitly deprioritised this half:**
- Shopify plugin (FY2027)
- Mobile consumer app (indefinitely deferred)
- Amazon India Syndication (requires AMS review, H1 2027)
- AI Review Writing Assistance (removed — legal risk)

If any PM needs resources to meet their committed item, flag it to me by April 15.`,

      `**Ravi Krishnan (PM, Analytics)** — April 12, 2026
Analytics Dashboard paid tier update:

Original target: Q2 2026 (May 31)
New target: Q3 2026 (September 30)

Why the slip: The Retail Intelligence data feed (competitive benchmarking) is the primary differentiator of the paid tier vs free tier. Priyanka's team is 6 weeks behind on attribute-level benchmarking data. Without it, the paid tier looks too similar to free.

Alternative option I considered: Launch paid tier without benchmarking (just longer lookback + export API). Priya and Arjun decided against — the competitive benchmarking is why clients will pay. Better to wait 6 weeks and launch the right product.

Walmart India impact: Export API < 1s is independent of the paid tier launch — I'm committing to that by August 15 regardless. Sandeep has confirmed this with Preethi Raj.`,

      `**Rohan Verma (PM, Visual UGC)** — May 8, 2026
Video UGC pipeline update — staging deployment complete.

Architecture confirmed:
- Upload: presigned S3 URL (no Apex server in upload path — max performance)
- Transcoding: AWS Lambda → ffmpeg (up to 60s clips, MP4/MOV/HEVC supported)
- Moderation: Bedrock Rekognition for NSFW + Claude Sonnet for nuanced brand safety
- CDN: CloudFront with adaptive bitrate streaming (360p / 720p / 1080p auto)

P99 latency for 60s clip: 72 seconds in staging. Target is < 90s — we're there.
Next: boAt pilot starts July 1. I need Swati's moderation team to review false positive rate on video within first week.

Reminder: boAt has committed to a ₹0.8 Cr contract expansion contingent on GA. Timeline is everything here.`,

      `**Tanvi Bhatt (PM, Enterprise SSO)** — June 5, 2026
SSO status update — flagging the Azure AD situation for visibility.

Google Workspace SSO: ✅ Complete, in staging
Okta: ✅ Complete, in staging
Azure AD: 🔄 70% complete — hitting Microsoft's metadata endpoint throttling in our test environment

Deepa's team is debugging the Azure AD issue. Root cause identified: we're hitting Microsoft's discovery endpoint on every auth request instead of caching the metadata. Fix is straightforward — implementing metadata caching with 24h TTL. ETA: 10 days.

GA is July 30. We're still on track but with zero buffer. If Azure AD debugging takes longer than 10 days, I'll need to make a call on whether to GA with Google + Okta only, and add Azure AD in August.

Walmart India requires Azure AD. If we GA without it, Sandeep needs to manage that conversation with Preethi Raj. Flagging proactively.`,

      `**Swati Gupta (PM, Moderation)** — June 20, 2026
Custom moderation rules — Myntra update.

Aditya Bose (Myntra) confirmed the rules they need by Q3:
1. Block reviews mentioning competitor brand names (Ajio, Meesho, Amazon)
2. Flag reviews with delivery complaints for expedited human review (SLA: 2 hours)
3. Auto-approve reviews above quality score 85 with no violations (speed up their queue)
4. Custom profanity list in Hindi — they have a list of 40 words from their content team

I've scoped this as 4 sprints of work. We can deliver all 4 by August 31.

One dependency: Rule #3 (auto-approve by quality score) requires Review Engine quality scorer API to return score synchronously. Kavitha — is real-time quality scoring feasible by August 1? Currently it's async (30–60 second delay). If not, I'll modify the rule to trigger after the async score arrives.`,
    ],
  },

  "stakeholder-updates": {
    channel: "#stakeholder-updates",
    messages: [
      `**Sandeep Gupta (VP Sales)** — March 18, 2026
Quarterly enterprise stakeholder update — Q1 2026 review:

**Walmart India** (Preethi Raj): Positive on the relationship, but flagged 3 open issues in our QBR:
1. Analytics export API latency is 3.2s average — she needs < 1s for their BI integration. Committed to August 15 fix.
2. Enterprise SSO — their IT policy requires Azure AD. Confirmed this is in Tanvi's scope for GA.
3. Video UGC pilot requested for Q3 after seeing boAt's results.
Preethi confirmed they're renewing if these 3 items are resolved. Renewal is September 15 — we need all 3 done by August 15.

**Nykaa** (Simran Kaur): Very positive. Asked to expand into Analytics paid tier and Visual UGC when Video GA. Also asked about Influencer Hub for their beauty creator programme. I've connected Simran with Pooja Iyer for a scoping call.

**Myntra** (Aditya Bose): Flagged Yotpo evaluation (see Arjun's message in #strategy-decisions). Top concern: real-time syndication. I'm scheduling a call this week to buy time until August 31 commitment.

**Himalaya** (Rakesh Nair): Budget cut internally. They've downgraded from 3 Sampling campaigns to 1. ARR impact: ₹0.4 Cr reduction. Not a full churn yet but watch this space.`,

      `**Karan Mehta (PM, Sampling)** — April 2, 2026
Himalaya situation — Rakesh Nair update.

Had a call with Rakesh today. Summary:
- Himalaya went through an internal restructuring — new CMO reduced influencer and advocacy budget by 40%
- They're keeping 1 Sampling campaign (Chyawanprash) but pausing Protein supplements and Baby care
- Rakesh personally advocates for Apex but the budget decision came from above him

What Karan Nair asked for (that I can't commit to yet):
- 20% price reduction on the remaining campaign
- Access to Loyalty & Rewards beta (he thinks gamified reviews will help re-engage their audience)

I'm recommending:
1. Don't discount — it sets a bad precedent and Himalaya's unit economics are already thin
2. Offer Loyalty & Rewards beta access at no additional cost as value-add (Divya's product needs beta testers anyway)

Sandeep — your call on the pricing. Flagging Divya on the beta access option.`,

      `**Pooja Iyer (PM, Influencer Hub)** — May 14, 2026
Nykaa × Influencer Hub scoping — outcome from Simran Kaur call.

Simran's ask: Nykaa runs a beauty creator programme (350 creators, they call it Nykaa Creator Club). They want to:
1. Feed their existing creator roster into Influencer Hub (CSV import or API)
2. Use Apex moderation on creator content before publishing
3. Tag creator reviews separately from organic reviews in Brand Portal and Analytics

What I told her:
- CSV import: Can do, 2 weeks of work
- API for creator roster: Q4 (Influencer Hub GA)
- Separate tagging: Already on H2 roadmap (Influencer Hub × Retail Intelligence integration)
- Timeline to full integration: Q4 2026

Simran is willing to wait for Q4 if we can give her CSV import by August. I'm committing to that. Arjun — flagging this as a commitment.

Revenue upside: Simran indicated this integration could justify expanding their contract by ₹0.8–1.2 Cr. Worth doing right.`,

      `**Sandeep Gupta (VP Sales)** — June 15, 2026
HDFC Bank pilot — first fintech client update.

Tanu Mehrotra (VP Digital, HDFC) gave us the green light to run a pilot for Financial Product Reviews — specifically for their credit card products.

Use case: HDFC wants customer reviews on their credit cards published on their website and app. They want moderation for brand risk content (complaints about fraud, comparison to competitors).

Key constraint from Tanu's legal team:
- Reviews must go through RBI-compliant moderation (no review can make investment-related claims)
- Data must be hosted on Indian servers (data localisation requirement)
- No PII in review text can leave India

Rahul — this is a new data residency requirement we haven't hit before. Does our current AWS India region setup cover this? Need answer before we commit to HDFC.

If this pilot works, the fintech vertical could be a new market segment. 6 banks in pipeline watching the HDFC outcome.`,
    ],
  },

  "leadership-asks": {
    channel: "#leadership-asks",
    messages: [
      `**Priya Mehta (CPO)** — February 20, 2026
To all PMs — please read and acknowledge:

Three non-negotiable product principles for FY2026:

1. **No AI output without disclosure.** Every AI-generated answer, summary, or moderation decision shown to an end user must be labelled. "Powered by AI" or "AI-generated summary." Legal has reviewed this. Non-negotiable, no exceptions.

2. **Sponsored content is always labelled.** Influencer Hub, Sampling & Advocacy, Loyalty & Rewards — any review where the reviewer received something of value must say so on the widget. FTC rules apply even in India for brands with US markets. Pooja, Karan, Divya — this is your responsibility to enforce in your respective products.

3. **Competitor data is only our own network data.** We do not scrape third-party platforms. Rajesh, Priyanka — this is the boundary for Competitor Benchmarking and Retail Intelligence. Legal flagged this as ToS violation risk multiple times. If anyone gets a request from a client to add scraped data, the answer is no.

These are product decisions, not suggestions.`,

      `**Vikram Nair (CEO)** — March 5, 2026
Two asks from the board that I'm translating into product asks:

**Ask 1 from board: When is Apex profitable?**
Ananya's answer: 18 months if ARR grows 40% this year. The LLM cost reduction OKR is specifically board-driven — every ₹1 we save in AI costs is a ₹1 step toward profitability. Rahul, Swati — the Haiku migration isn't just an engineering choice, it's a board commitment.

**Ask 2 from board: What's our defensibility against BazaarVoice and PowerReviews?**
My answer: India market + affordability + Commerce Intelligence Platform (not just reviews). Priya — I need a one-page competitive positioning document by March 15 that we can share with investors. What do we have that BV and PowerReviews don't? Start with the India thesis, the pricing, and the AI layer.

Sandeep — board also asked about BazaarVoice's India presence. Can you get competitive intelligence on whether they're actively selling into India and at what price point?`,

      `**Deepa Reddy (VP Engineering)** — April 18, 2026
Engineering capacity update for H2 — sharing so PMs can plan:

We have 43 engineers across all teams. Current allocation for H2 committed items:
- Enterprise SSO: 6 engineers (priority, Tanvi's product)
- Ratings & Reviews API: 5 engineers (Neha's product, maintenance + new features)
- Visual UGC / Video pipeline: 4 engineers (Rohan's product)
- Moderation / Review Engine: 4 engineers (Swati + Kavitha)
- Analytics Dashboard: 4 engineers (Ravi's product)
- Syndication: 3 engineers (Aditya's product)

That's 26 of 43 committed. The remaining 17 are split across 14 other products.

If any PM has a committed item that needs more than their current allocated engineers, flag it to me by April 30 with a business case. I can reallocate from non-committed work. But I need to know early — not 2 weeks before a deadline.

Specifically flagging: API Developer Portal is under-resourced at 2 engineers for Q4 GA. Ishaan — is that enough? Let's talk.`,

      `**Priya Mehta (CPO)** — June 1, 2026
Mid-year PM check-in — what I'm watching for H2:

We're behind on ARR. The three things that recover H2:
1. SSO GA by July 30 — Tanvi, this is your most visible contribution to company ARR ever. I'm checking in weekly.
2. Analytics paid tier by September 30 — Ravi, no more slips. If Retail Intelligence data isn't ready, we launch without it and add benchmarking in Q4.
3. Myntra retention — Arjun + Sandeep, we cannot lose ₹1.9 Cr ARR. Real-time syndication by August 31 is the commitment.

Beyond the big three — two products I think are underappreciated:
- Checkout Optimization (Meera): +8% conversion lift at Nykaa is a stunning result. I want a case study written up for the Sales team by July 15. If we can show this to Myntra and Walmart India, we can upsell.
- Search & Discovery (Aakash): The Voyage AI bet looks right. 4.3/5 relevance score in beta. I want a GA plan for Q2 2027 presented to me by August 1.

To all PMs: your mid-year performance review is September 30. The question is: did your committed items ship, and did they drive measurable business impact?`,
    ],
  },

  "product-team": {
    channel: "#product-team",
    messages: [
      `**Neha Joshi (PM, Ratings & Reviews)** — March 10, 2026
Resolved: the v1 API deprecation question.

After 3 weeks of back and forth, Arjun and I have decided to push v1 deprecation to Q4 2026. The blockers:
- Himalaya (Rakesh Nair) is still on v1 — their dev team has bandwidth constraints
- An unnamed P2 client is on v1 and hasn't responded to our migration outreach

We're giving everyone until October 31 to migrate. After that, v1 is sunset.

What this means for Neha's team: we carry forward the v1 maintenance burden for 6 more months. Estimated cost: 0.5 engineer. Annoying but the right call.

Note for Sanjay (engineering): please continue throttling v1 at 100 RPS. Anyone hitting that limit gets a personal migration call from me.`,

      `**Shruti Agarwal (PM, Q&A)** — April 22, 2026
Community answers experiment — wrapping up.

We tried letting verified purchasers answer other shoppers' questions (similar to Amazon's "Customers also answered" feature). Ran for 8 weeks across Nykaa beauty category.

Results:
- Only 12% of verified purchasers eligible for community answering actually answered
- Of those answers, 34% were flagged by moderation as off-topic or unhelpful
- Net new answers from community: +240 over 8 weeks (vs 3,400 from brand team + AI in same period)

Verdict: Community answers are a lot of product complexity for minimal volume addition. Deprioritising from H1 roadmap. Pushing to H2 at earliest, and only if we find a better activation mechanic.

Arjun signed off. If anyone has creative ideas on how to increase community participation, DM me — genuinely open to it before we kill it completely.`,

      `**Divya Sharma (PM, Loyalty & Rewards)** — May 30, 2026
Nykaa Pink integration scoping — sharing early findings.

Simran Kaur's team sent over the Nykaa Pink API spec. Some findings:

Good news: Their points system is straightforward — 1 point = ₹0.10, redeemable at checkout. Mapping Apex points to Nykaa Pink points is technically clean.

Challenge: Nykaa Pink points expire every 12 months. If a shopper earns points for a review and doesn't redeem in 12 months, they expire. We need to either (a) notify users before expiry via email, or (b) make this very clear in the rewards UI at the time of earning.

I'm going with option (b) — transparent UX at point of earning. "Earn 50 Nykaa Pink points (valid 12 months)" shown in the review submission form. Simple, no email dependency.

Also discovered: Nykaa's API has a 60-day delay between point award and redemption availability (fraud prevention on their side). So review → Apex awards points → 60 days → Nykaa Pink spendable. This changes the value proposition slightly. Simran is fine with it.

Target: Nykaa Pink integration by Q3 2026. On track.`,

      `**Manish Kumar (PM, Social Commerce)** — June 8, 2026
TikTok Shop decision — documenting for the record.

Following our discussion last week: we are formally pausing all TikTok Shop integration work.

Reason: TikTok India regulatory status remains uncertain. The government's position on TikTok data has shifted twice in the last 6 months. We can't commit engineering time to an integration on a platform that may not be operational in India at launch.

Vikram Nair and Rahul Sharma aligned on this in the June 5 leadership meeting. I was there.

What this means for Social Commerce H2 roadmap:
- Instagram Shopping GA: On track for July 2026
- WhatsApp Commerce: Mamaearth pilot August 2026
- TikTok Shop: Moved to "monitor" status. Revisit Q1 2027.

The 2 engineers originally allocated to TikTok are being redirected to WhatsApp Commerce to accelerate that. Deepa has confirmed.`,

      `**Ishaan Chandra (PM, API Developer Portal)** — June 25, 2026
Developer Portal — naming and positioning question for the team.

I'm deciding between two names for the portal we're launching Q4:
1. **Apex Developer Hub** (broad, signals ecosystem)
2. **Apex API Portal** (descriptive, functional)

Also debating whether to use our own subdomain (developer.apexcommerce.io) vs a standalone domain (apexdev.io — domain is available for ₹800/year).

My lean: Apex Developer Hub at developer.apexcommerce.io. Keeps us connected to the Apex brand, no extra domain cost, and "Hub" positions it as an ecosystem resource, not just docs.

Sending this to Priya and Rahul for final call. Also CCing Nikhil Bose (Marketing) — this needs to be in the Q4 launch announcement plan.

One other update: Redocly is confirmed for doc infrastructure. ₹3.5 L/year enterprise plan, supports OpenAPI 3.1, has interactive API explorer built in. Way better than Stoplight for our use case.`
    ],
  },
};

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("Missing SUPABASE_URL or SERVICE_KEY — check .env.local");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  // Get Notion token
  const { data: sources } = await supabase
    .from("sources")
    .select("metadata, user_id")
    .eq("provider", "notion")
    .in("status", ["connected", "syncing"])
    .limit(1);

  const notionToken: string = sources?.[0]?.metadata?.access_token;
  if (!notionToken) {
    console.error("No connected Notion source found. Connect Notion in Integrations first.");
    process.exit(1);
  }
  console.log("✓ Notion token found\n");

  // Try to find a parent page; fall back to workspace root
  const searchRes: { results?: { id: string; object: string }[] } = await (await fetch("https://api.notion.com/v1/search", {
    method:"POST",
    headers:{ Authorization:`Bearer ${notionToken}`, "Notion-Version":NOTION_VER, "Content-Type":"application/json" },
    body: JSON.stringify({ page_size: 10 }),
  })).json();

  const parentPage = searchRes.results?.find(r => r.object === "page");
  const parentId: string | null = parentPage?.id ?? null;

  if (parentId) {
    console.log(`✓ Using parent page: ${parentId}\n`);
  } else {
    console.log("✓ No parent page found — creating at workspace root\n");
  }

  // ── Company pages ────────────────────────────────────────────────────────────
  console.log("=== Company & Org pages ===");
  await createPage(notionToken, parentId, "Apex Commerce — Company Vision, Mission & Values", COMPANY_VISION);
  await createPage(notionToken, parentId, "Org Structure & Leadership — Apex Commerce", ORG_STRUCTURE);
  await createPage(notionToken, parentId, "FY2026 Strategy — Apex Commerce", STRATEGY_FY2026);
  await createPage(notionToken, parentId, "H1 2026 OKRs — Apex Commerce", OKRS_H1_2026);
  await createPage(notionToken, parentId, "Enterprise Stakeholder Map — Apex Commerce", STAKEHOLDER_MAP);

  // ── Product pages ────────────────────────────────────────────────────────────
  console.log("\n=== 20 Product pages ===");
  for (const product of PRODUCTS) {
    await createPage(notionToken, parentId, product.title, product.blocks);
    await new Promise(r => setTimeout(r, 350)); // rate limit buffer
  }

  // ── Slack output ─────────────────────────────────────────────────────────────
  console.log("\n\n═══════════════════════════════════════════════════════════════");
  console.log("SLACK — PASTE THESE MESSAGES MANUALLY (no chat:write scope)");
  console.log("═══════════════════════════════════════════════════════════════\n");

  for (const [key, { channel, messages }] of Object.entries(SLACK_CHANNELS)) {
    console.log(`\n${"─".repeat(60)}`);
    console.log(`Channel: ${channel}  (${messages.length} messages)`);
    console.log("─".repeat(60));
    for (let i = 0; i < messages.length; i++) {
      console.log(`\n[Message ${i+1}/${messages.length}]`);
      console.log(messages[i]);
      console.log();
    }
  }

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("DONE — Paste the Slack messages above into their channels,");
  console.log("then go to Integrations in Seam and run Sync on Notion + Slack.");
  console.log("═══════════════════════════════════════════════════════════════\n");

  // ── Test queries ─────────────────────────────────────────────────────────────
  console.log("Test these queries in Seam after syncing:");
  const queries = [
    "Why was Enterprise SSO deprioritised for so long?",
    "What did Walmart India commit to and what's at risk in their renewal?",
    "Who owns the Analytics Dashboard and when does the paid tier launch?",
    "Why did we pause TikTok Shop integration?",
    "What is the strategy for FY2026 and what did we deprioritise?",
    "Which enterprise clients are at risk of churning?",
    "What are the 20 products Apex Commerce builds?",
    "Why did we switch to Claude Haiku for moderation?",
    "What did Priya Mehta say about AI disclosure requirements?",
    "What is boAt's relationship with Apex and what's at stake?",
    "Why did we choose to build the authenticity detector in-house?",
    "What are the H1 2026 OKRs and which ones are behind?",
  ];
  queries.forEach((q, i) => console.log(`  ${i+1}. ${q}`));
}

main().catch(e => { console.error(e); process.exit(1); });
