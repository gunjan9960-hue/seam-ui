#!/usr/bin/env npx tsx
/**
 * Creates a clean top-level Apex Commerce workspace in Notion:
 *
 *   📁 Apex Commerce                  ← workspace-root page (selectable from Notion library)
 *     ├── 📄 Company & Strategy       ← section 1 (5 pages)
 *     ├── 📄 Core Platform Products   ← section 2 (5 pages)
 *     ├── 📄 Commerce & Growth        ← section 3 (5 pages)
 *     ├── 📄 Intelligence & Analytics ← section 4 (5 pages)
 *     └── 📄 Platform & Infra         ← section 5 (5 pages)
 *
 * Run: npx tsx scripts/seed-apex-workspace.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const eq = line.indexOf("=");
    if (eq > 0 && !line.startsWith("#")) {
      const k = line.slice(0, eq).trim();
      const v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const NOTION_VER   = "2022-06-28";

// ── Notion helpers ─────────────────────────────────────────────────────────────
const h2  = (t: string) => ({ object:"block",type:"heading_2",  heading_2:{rich_text:[{type:"text",text:{content:t}}]} });
const h3  = (t: string) => ({ object:"block",type:"heading_3",  heading_3:{rich_text:[{type:"text",text:{content:t}}]} });
const p   = (t: string) => ({ object:"block",type:"paragraph",  paragraph:{rich_text:[{type:"text",text:{content:t}}]} });
const b   = (t: string) => ({ object:"block",type:"bulleted_list_item", bulleted_list_item:{rich_text:[{type:"text",text:{content:t}}]} });
const n   = (t: string) => ({ object:"block",type:"numbered_list_item", numbered_list_item:{rich_text:[{type:"text",text:{content:t}}]} });
const div = ()          => ({ object:"block",type:"divider",divider:{} });
const call = (t: string, emoji: string) => ({
  object:"block",type:"callout",
  callout:{rich_text:[{type:"text",text:{content:t}}],icon:{type:"emoji",emoji}},
});

async function notionPost(path: string, token: string, body: object) {
  const r = await fetch(`https://api.notion.com/v1${path}`, {
    method: "POST",
    headers: { Authorization:`Bearer ${token}`, "Notion-Version":NOTION_VER, "Content-Type":"application/json" },
    body: JSON.stringify(body),
  });
  return r.json();
}

async function createPage(token: string, parentId: string | null, title: string, icon: string, blocks: object[]): Promise<string | null> {
  const parent = parentId ? { page_id: parentId } : { type:"workspace", workspace:true };
  const res: { id?: string; message?: string } = await notionPost("/pages", token, {
    parent,
    icon: { type:"emoji", emoji: icon },
    properties: { title:{ title:[{ type:"text", text:{ content:title } }] } },
    children: blocks.slice(0, 99),
  });
  if (!res.id) {
    console.error(`  ✗ ${title} — ${(res as {message?:string}).message ?? JSON.stringify(res).slice(0,120)}`);
    return null;
  }
  if (blocks.length > 99) {
    await notionPost(`/blocks/${res.id}/children`, token, { children: blocks.slice(99) });
  }
  console.log(`  ✓ ${title}`);
  return res.id;
}

// ── Content blocks ─────────────────────────────────────────────────────────────

const PAGES: Record<string, { section: string; icon: string; title: string; blocks: object[] }[]> = {

  "Company & Strategy": [
    {
      section: "Company & Strategy",
      icon: "🏢",
      title: "Company Vision, Mission & Values",
      blocks: [
        call("Apex Commerce — B2B SaaS · Commerce Content & Intelligence Platform · Series C · 210 employees · HQ Bengaluru + NYC", "🏢"),
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
        n("Profitability path: Reduce LLM costs by 40% via model tiering."),
        div(),
        h2("Key Numbers — H1 2026"),
        b("ARR: ₹38 Cr (growing 62% YoY) — behind ₹42 Cr H1 target"),
        b("Enterprise clients: 47 active (retention 94%)"),
        b("Reviews processed monthly: 4.2 million"),
        b("Avg NPS from enterprise clients: 52"),
        b("Runway: 28 months at current burn"),
        div(),
        h2("What Apex Is NOT"),
        b("NOT a social listening tool — we work with owned content, not crawled social data."),
        b("NOT a CRM — we plug into Salesforce, HubSpot, but do not replace them."),
        b("NOT a Shopify app — we serve enterprise retail, not SMB DTC."),
      ],
    },
    {
      section: "Company & Strategy",
      icon: "🏛️",
      title: "Org Structure & Leadership",
      blocks: [
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
      ],
    },
    {
      section: "Company & Strategy",
      icon: "🎯",
      title: "FY2026 Strategy",
      blocks: [
        call("FY2026 Strategy — Approved by Vikram Nair (CEO) and Priya Mehta (CPO) in January 2026 planning session", "🎯"),
        h2("Theme: From Feature Provider to Commerce Intelligence Platform"),
        p("FY2025 grew ARR 62% by selling point solutions. FY2026 is about selling the platform: a single contract covering 3+ products with Analytics Dashboard as the intelligence layer that ties everything together."),
        div(),
        h2("Five Strategic Bets — Ranked by Expected ARR Impact"),
        n("Analytics Dashboard as upsell anchor — expected +₹8 Cr ARR"),
        n("Video UGC expansion — +₹5 Cr ARR. Nykaa and boAt pre-committed pending GA."),
        n("API Developer Portal — +₹3 Cr ARR via channel partners. 3 channel partners signed LOI."),
        n("Southeast Asia entry (Singapore-first) — +₹2 Cr ARR"),
        n("Enterprise SSO GA — unblocks ₹6.5 Cr in stalled expansion across 11 deals"),
        div(),
        h2("What We Deprioritised in FY2026 and Why"),
        b("Mobile app for end-consumers: Not our ICP. Brands are our customer, not shoppers. Deferred indefinitely."),
        b("Shopify plugin: Market is SMB, not enterprise. Margin too low. Deferred to FY2027."),
        b("AI Review Writing Assistance: Legal flagged authenticity risk. Removed from roadmap June 2025."),
        b("Social listening on external platforms: Out of scope — we work with owned data only."),
        div(),
        h2("Key Cross-Functional Commitments"),
        b("Q2 2026: Enterprise SSO GA — committed to Walmart India and Nykaa. Now delayed to July 30."),
        b("Q3 2026: Video UGC GA — committed to boAt (₹1.4 Cr contract expansion pending)."),
        b("Q3 2026: Analytics Dashboard paid tier — pricing approved by Ananya Singh (CFO)."),
        b("Q4 2026: API Developer Portal v1 — committed to 3 channel partners (contracts signed)."),
        div(),
        h2("Risk Register"),
        b("Risk 1 (HIGH): LLM costs growing 8% MoM. Mitigation: Claude Haiku for moderation (65% cost saving). Approved June 2026."),
        b("Risk 2 (HIGH): Enterprise SSO slipped 4 weeks. Tanvi's team needs 2 additional engineers. Deepa reallocating from Sampling by July 15."),
        b("Risk 3 (MEDIUM): Walmart India contract renewal September 2026. 3 open issues must close by August 15."),
        b("Risk 4 (MEDIUM): Myntra evaluating Yotpo. Sandeep Gupta running competitive review by end of Q2."),
      ],
    },
    {
      section: "Company & Strategy",
      icon: "📊",
      title: "H1 2026 OKRs",
      blocks: [
        call("H1 2026 OKRs — Set January 2026, Reviewed by Priya Mehta and Arjun Kapoor quarterly", "📊"),
        h2("Company OKR 1: Grow ARR to ₹42 Cr by June 30, 2026"),
        b("KR1.1: Net new ARR from upsell ≥ ₹6 Cr (owner: Sandeep Gupta)"),
        b("KR1.2: Enterprise churn rate < 4% (owner: Arjun Kapoor)"),
        b("KR1.3: 3 new enterprise logos > ₹1 Cr ARR each (owner: Sandeep Gupta)"),
        p("Status June 2026: ARR at ₹38 Cr. Net new upsell at ₹4.2 Cr — behind target. 2 new logos closed (Croma, HDFC). Churn at 6% due to Himalaya downgrade."),
        div(),
        h2("Company OKR 2: Platform depth — avg products per customer ≥ 2.5"),
        b("KR2.1: Launch Analytics Dashboard paid tier by May 31 (owner: Ravi Krishnan) — SLIPPED to Q3"),
        b("KR2.2: 15 enterprise customers using ≥ 3 Apex products (owner: Arjun Kapoor) — at 11"),
        b("KR2.3: Net Promoter Score ≥ 55 (owner: Priya Mehta) — at 52"),
        div(),
        h2("Product OKR 1: Enterprise SSO GA by Q2 end"),
        b("KR: All 11 waiting enterprise deals unblocked — SLIPPED to July 30"),
        b("KR: SSO supports Google, Okta, Azure AD on day one"),
        b("KR: Zero P0 security incidents in first 60 days"),
        p("Status: 80% complete. Azure AD fixing metadata caching issue. ETA July 30."),
        div(),
        h2("Product OKR 2: Video UGC GA by Q3 2026"),
        b("KR: Video pipeline live in staging by June 15 — DONE"),
        b("KR: boAt pilot CSAT ≥ 4.0/5 on video moderation quality — Starting July 1"),
        b("KR: P99 video processing latency < 90 seconds — Currently 72s in staging ✓"),
        div(),
        h2("Product OKR 3: LLM cost per review < ₹0.08"),
        b("KR: Claude Haiku replaces Sonnet for moderation by May 1 — DONE (May 20)"),
        b("KR: False positive rate < 2% after model switch — At 1.8% ✓"),
        b("KR: Cost per review < ₹0.08 — Currently at ₹0.09, not yet at target"),
      ],
    },
    {
      section: "Company & Strategy",
      icon: "🗺️",
      title: "Enterprise Stakeholder Map",
      blocks: [
        call("Maintained by Sandeep Gupta (VP Sales) and Arjun Kapoor (Group PM). Last updated June 2026.", "🗺️"),
        h2("Tier 1 — P0 Accounts (₹2 Cr+ ARR)"),
        h3("Walmart India — ₹4.2 Cr ARR"),
        b("Contact: Preethi Raj, Director Digital Commerce — preethi.raj@walmart.com"),
        b("Open issues: (1) SSO integration blocked. (2) Video UGC pilot requested Q3. (3) Analytics export API >3s latency (target <1s)."),
        b("Renewal: September 15, 2026. At risk if SSO not live by August 15."),
        h3("Nykaa — ₹2.8 Cr ARR"),
        b("Contact: Simran Kaur, VP Digital Experience — expansion in discussion +₹1.5 Cr"),
        b("Key asks: Video UGC by Q3, influencer review tagging, GDPR-ready exports"),
        div(),
        h2("Tier 2 — P1 Accounts (₹1–2 Cr ARR)"),
        b("Myntra (₹1.9 Cr): Aditya Bose — evaluating Yotpo. Wants real-time syndication (< 15 min, we're at 4.2 hours)."),
        b("boAt (₹1.4 Cr): Riya Malhotra — Video UGC GA → +₹0.8 Cr contract expansion."),
        b("Mamaearth (₹1.1 Cr): Gaurav Singh — Influencer Hub integration with their creator programme."),
        div(),
        h2("Tier 3 — P2 Accounts (< ₹1 Cr ARR / Pilot)"),
        b("Flipkart (₹0.8 Cr): Siddharth Roy — Seller platform pilot. Expansion decision Q3 2026."),
        b("HDFC Bank (pilot): Tanu Mehrotra — Financial product reviews. First fintech use case. RBI compliance + data residency required."),
        b("Himalaya (₹0.7 Cr): Rakesh Nair — Downgraded from P1 after budget cut. Churn risk."),
        b("Croma (₹0.4 Cr): Vandana Shah — Q1 2026 acquisition. First renewal December 2026."),
        div(),
        h2("Feature Commitments Tracker"),
        b("Enterprise SSO: Committed to Walmart India + Nykaa. Due July 30, 2026 (4 weeks late)."),
        b("Analytics Export API < 1s: Committed to Walmart India. Due August 15, 2026."),
        b("Video UGC GA: Committed to boAt + Nykaa. Due Q3 2026 (on track)."),
        b("Real-time syndication (< 15 min): Committed to Myntra. Due August 31, 2026."),
        b("Custom moderation rules: Committed to Myntra. Due Q3 2026. Owner: Swati Gupta."),
        b("Influencer Hub CSV import: Committed to Nykaa. Due August 2026. Owner: Pooja Iyer."),
      ],
    },
  ],

  "Core Platform Products": [
    {
      section: "Core Platform Products",
      icon: "⭐",
      title: "Product: Ratings & Reviews API",
      blocks: [
        call("PM: Neha Joshi · Group PM: Arjun Kapoor · Stage: GA · ARR: ₹14 Cr (37% of total revenue)", "⭐"),
        h2("What it does"),
        p("Core product. REST + GraphQL API for collecting, storing, moderating, and serving customer ratings and reviews. Powers widgets, brand portal, and analytics layer. 4.2M reviews processed monthly."),
        h2("Current Status"),
        b("API v3.5 in production — 99.98% uptime over 12 months. Avg response 142ms (p99: 380ms)."),
        b("Major Q1 2026 release: Attribute-based ratings (sub-ratings per product dimension)."),
        h2("H2 2026 Roadmap"),
        n("v3.6 — Real-time webhook delivery of new reviews to brand systems (July 2026)"),
        n("v3.7 — AI-generated review summary endpoint (August 2026)"),
        n("v3.8 — Multi-locale support: Hindi, Tamil, Telugu (November 2026)"),
        n("Analytics API v2 — sub-second latency, committed to Walmart India (August 2026)"),
        h2("Key Decisions"),
        b("March 2026: Added GraphQL — Nykaa and Myntra both requested it. Owner: Neha Joshi, approved by Arjun Kapoor."),
        b("Jan 2026: Dropped v1 deprecation from H1 — Himalaya not migrated. Pushed to Q4 2026."),
        b("Open question: Should we build a review reply API? Nykaa has requested. 8 weeks estimate. Decision needed July 31."),
      ],
    },
    {
      section: "Core Platform Products",
      icon: "🔬",
      title: "Product: Review Engine",
      blocks: [
        call("PM: Kavitha Nair · ML Lead: Dr. Ankit Jain · Stage: GA · ARR: ₹3.8 Cr", "🔬"),
        h2("What it does"),
        p("Intelligence layer on top of raw reviews. Runs ML quality scoring, authenticity checks, sentiment analysis, and keyword extraction on every incoming review. Powers moderation prioritisation and Analytics Dashboard."),
        h2("ML Models in Production"),
        b("Quality Scorer v2: 0–100 helpfulness score. Trained on 2.4M human-rated reviews."),
        b("Authenticity Detector: Flags suspicious reviews. FPR: 0.8%, FNR: 2.1%."),
        b("Sentiment Analyser: 3-class per review + per sentence. Accuracy 91.3%."),
        b("Topic Extractor: Key product attributes mentioned (battery life, packaging, scent, etc.)"),
        h2("H2 2026 Roadmap"),
        n("Quality Scorer v3: Image quality signals — August 2026"),
        n("Multilingual sentiment: Hindi, Tamil, Telugu — October 2026"),
        n("Real-time scoring API: Sub-100ms on review submission (currently async) — November 2026"),
        h2("Key Decisions"),
        b("Decision (March 2026): Kept authenticity detection in-house rather than Sift Science. Reason: 3 BFSI clients have contractual prohibition on sending raw review text off-platform. Kavitha Nair + Arjun Kapoor."),
      ],
    },
    {
      section: "Core Platform Products",
      icon: "🛡️",
      title: "Product: Moderation Suite",
      blocks: [
        call("PM: Swati Gupta · ML Lead: Dr. Ankit Jain · Stage: GA · Cross-product dependency", "🛡️"),
        h2("What it does"),
        p("Content moderation for all user-generated content. Handles profanity, spam, NSFW, competitor brand attacks, legal risk flagging. Runs on every review, photo, video, and Q&A submission."),
        h2("Architecture — Three-Layer Pipeline"),
        b("Layer 1 (~95% volume): Claude Haiku — fast, cheap, clear violations"),
        b("Layer 2 (~4% volume): Claude Sonnet — nuanced borderline cases"),
        b("Layer 3 (~1% volume): Human moderators — legal risk, brand crises"),
        b("Custom rules engine: Brands add their own keyword blocklists and category rules"),
        h2("H2 2026 Roadmap"),
        n("Custom moderation rules UI in Brand Portal (committed to Myntra) — Q3 2026"),
        n("Multilingual moderation: Hindi, Tamil, Telugu — Q4 2026"),
        n("Video content moderation: Extend to Visual UGC video pipeline — Q3 2026"),
        h2("Key Decisions"),
        b("Decision (May 2026): Switched Layer 1 from Claude Sonnet to Haiku. Cost: ₹0.22 → ₹0.09/review (59% reduction). FPR: 1.2% → 1.8% — within acceptable range. Approved by Rahul Sharma (CTO). Owner: Swati Gupta."),
        b("Decision (April 2026): Human moderation SLA = 4 hours for escalations (was 24 hours). Changed after Nykaa complained about brand-damaging review live for 18 hours. Priya Mehta directive."),
      ],
    },
    {
      section: "Core Platform Products",
      icon: "🏪",
      title: "Product: Brand Portal",
      blocks: [
        call("PM: Amit Sinha · Stage: GA · 47 enterprise clients use it daily · DAU: 210 brand users", "🏪"),
        h2("What it does"),
        p("Self-serve web dashboard where brand and retail clients manage everything: view and respond to reviews, manage UGC campaigns, configure widgets, access analytics, and set moderation rules."),
        h2("Current State"),
        b("Most used feature: Review queue management (94% of users weekly)"),
        b("Least used feature: Bulk export (8% — most use API)"),
        b("NPS from Brand Portal specifically: 48"),
        h2("H2 2026 Roadmap"),
        n("Q&A Management panel — Q3 2026"),
        n("Custom moderation rules UI for Myntra — Q3 2026 (committed)"),
        n("SSO integration: Brands log in with their own SSO — pending Enterprise SSO GA (July 2026)"),
        n("Mobile-responsive redesign: 31% of users access on mobile — Q4 2026"),
        h2("Key Decisions"),
        b("Decision (March 2026): Migrated from Angular to React. Reason: Angular expertise was a hiring bottleneck. Deepa Reddy and Amit Sinha decision."),
        b("Decision (April 2026): Mobile app for brand users deprioritised — 31% mobile access is read-only. Mobile web is sufficient."),
      ],
    },
    {
      section: "Core Platform Products",
      icon: "🧩",
      title: "Product: Review Widgets",
      blocks: [
        call("PM: Suresh Pillai · Stage: GA · 47 enterprise clients · 18.4M weekly widget loads", "🧩"),
        h2("What it does"),
        p("JavaScript widgets that embed Apex review content into brand and retailer websites. Includes: star rating summary, full review list, photo gallery, Q&A panel, and review submission form. Loaded asynchronously with < 50ms TTI impact."),
        h2("Current Performance"),
        b("P99 load time: 320ms. TTI impact: < 50ms. WCAG 2.1 AA compliant."),
        h2("H2 2026 Roadmap"),
        n("Widget Studio: No-code customisation of colours, fonts, layout in Brand Portal — Q3 2026"),
        n("Web Components standard: Migrate from iFrame — Q4 2026"),
        n("AMP support: Accelerated Mobile Pages variant — Q4 2026"),
        h2("Key Decisions"),
        b("Decision (Feb 2026): Keeping iFrame for now — migration to Web Components is 12 weeks and 47 clients would need to re-embed. Suresh Pillai + Arjun Kapoor. Right choice, wrong timing."),
      ],
    },
  ],

  "Commerce & Growth Products": [
    {
      section: "Commerce & Growth Products",
      icon: "📸",
      title: "Product: Visual UGC",
      blocks: [
        call("PM: Rohan Verma · Stage: GA (Photo) · Beta (Video) · ARR: ₹5.2 Cr", "📸"),
        h2("What it does"),
        p("Enables brands to collect, moderate, and display photo and video reviews. Photos attached to reviews. Nykaa uses it to display customer selfies on product pages, driving 23% higher conversion."),
        h2("Video UGC — In Development (Q3 2026 Target)"),
        b("Architecture: Upload → S3 → Lambda transcoding → Bedrock content moderation → CDN delivery"),
        b("Video length: Up to 60 seconds. P99 processing: 72s in staging (target <90s) ✓"),
        b("Committed to: boAt (+₹0.8 Cr expansion pending GA) and Nykaa"),
        b("boAt pilot: Starting July 1, 2026. CSAT target: ≥ 4.0/5"),
        h2("Key Decisions"),
        b("Decision (April 2026): Chose AWS Bedrock for video moderation over custom ML — faster time-to-market. Approved by Rahul Sharma (CTO). Will revisit at 1M videos/month."),
        b("Decision (Feb 2026): Capped video at 60 seconds — user research with boAt showed reviewers don't watch longer videos."),
      ],
    },
    {
      section: "Commerce & Growth Products",
      icon: "🔄",
      title: "Product: Syndication Platform",
      blocks: [
        call("PM: Aditya Patel · Stage: GA · ARR: ₹4.1 Cr · Key account: Myntra, Walmart India", "🔄"),
        h2("What it does"),
        p("Distributes brand-collected reviews from manufacturer sites to retailer pages. Brand collects on their own site → Apex syndicates to Walmart India, Myntra, Flipkart, Croma simultaneously."),
        h2("Network"),
        b("23 brand sources · 11 retail destinations · 1.1M monthly syndicated reviews"),
        b("Avg time-to-syndication: 4.2 hours — Myntra wants <15 min (committed August 31)"),
        h2("H2 2026 Roadmap"),
        n("Real-time syndication (< 15 min) — August 31, 2026 (committed to Myntra)"),
        n("Video review syndication — Q4 2026"),
        n("Southeast Asia: Tokopedia + Shopee — Q4 2026"),
        h2("Key Decisions"),
        b("Decision (Jan 2026): Built custom transformation layer over BazaarVoice Syndication API — our in-house cost is 80% cheaper at scale. Approved by Ananya Singh (CFO)."),
        b("Decision (April 2026): Deprioritised Amazon India — requires AMS partnership review (6-month process). Pushed to H1 2027."),
      ],
    },
    {
      section: "Commerce & Growth Products",
      icon: "❓",
      title: "Product: Q&A Module",
      blocks: [
        call("PM: Shruti Agarwal · Stage: GA · ARR: ₹1.8 Cr", "❓"),
        h2("What it does"),
        p("Allows shoppers to ask product questions on brand/retailer pages. Routed to: (1) existing reviews for AI-generated answers, (2) brand team, (3) verified purchasers. Reduces pre-purchase friction, increases conversion."),
        h2("Key Metrics"),
        b("Question-to-answer rate: 78% (industry avg: 52%)"),
        b("AI-answered rate: 43% — no human needed"),
        b("Conversion lift with Q&A: +11% (Nykaa A/B test, Q1 2026)"),
        h2("H2 2026 Roadmap"),
        n("AI answer quality v2: Fine-tuned on product category knowledge — Q3 2026"),
        n("Brand moderation dashboard in Brand Portal — Q3 2026"),
        n("Multi-language Q&A: Hindi support — Q4 2026"),
        h2("Key Decisions"),
        b("Decision (Feb 2026): AI-generated answers must show 'Powered by AI' label — legal requirement. Priya Mehta, non-negotiable."),
        b("Decision (March 2026): Community answers deprioritised. Pilot: only 12% of eligible users answered, 34% of answers flagged as unhelpful. Shruti Agarwal + Arjun Kapoor. Pushed to H2."),
      ],
    },
    {
      section: "Commerce & Growth Products",
      icon: "📦",
      title: "Product: Sampling & Advocacy",
      blocks: [
        call("PM: Karan Mehta · Stage: GA · ARR: ₹2.1 Cr", "📦"),
        h2("What it does"),
        p("Brands send product samples to opted-in advocates in exchange for verified reviews. Manages full workflow: advocate selection, fulfillment, review collection, quality analytics."),
        h2("Key Metrics"),
        b("Review collection rate post-sample: 67% (industry benchmark: 45%)"),
        b("Sampled review quality score: 84/100 avg vs 71/100 organic"),
        b("Top client at risk: Himalaya (3 campaigns → 1 due to budget cut)"),
        h2("H2 2026 Roadmap"),
        n("Automated advocate scoring using Review Engine signals — Q3 2026"),
        n("Fulfilment API: Shiprocket/Delhivery integration — Q3 2026"),
        n("Enterprise tier: Priority processing for ₹50 Cr+ brands — Q4 2026"),
        h2("Key Decisions"),
        b("Decision (Feb 2026): Advocates must disclose sample receipt — mandatory in submission flow. FTC compliance, non-negotiable."),
        b("Decision (May 2026): Himalaya flagged as churn risk. Paused new features for their account until renewal confirmed. Karan Mehta + Sandeep Gupta."),
      ],
    },
    {
      section: "Commerce & Growth Products",
      icon: "🛒",
      title: "Product: Checkout Optimization",
      blocks: [
        call("PM: Meera Nambiar · Stage: Beta · ARR: ₹0.3 Cr · Target GA: Q3 2026", "🛒"),
        h2("What it does"),
        p("Injects review signals (star rating, review count, top snippet) directly into checkout flow — add-to-cart, cart, and payment pages. Shows social proof at highest purchase intent moment."),
        h2("Conversion Impact"),
        b("Nykaa A/B test (Feb 2026): +8% checkout completion when review snippet shown on cart page"),
        b("Myntra pilot: +5% add-to-cart rate when star rating shown on listing"),
        h2("H2 2026 Roadmap"),
        n("Myntra checkout integration GA — Q3 2026"),
        n("Personalised review snippet: Show review most relevant to this shopper — Q4 2026"),
        n("WhatsApp cart recovery: Send review snippet in abandoned cart message — Q4 2026"),
        h2("Key Decisions"),
        b("Decision (April 2026): Will not show review count below 5 reviews in checkout — creates negative social proof. Pages with 1–4 reviews had lower conversion than showing no reviews. Meera Nambiar, backed by Nykaa data."),
      ],
    },
  ],

  "Intelligence & Analytics": [
    {
      section: "Intelligence & Analytics",
      icon: "📊",
      title: "Product: Analytics Dashboard",
      blocks: [
        call("PM: Ravi Krishnan · Stage: GA (free) · Paid tier Q3 2026 · Primary upsell anchor for FY2026", "📊"),
        h2("What it does"),
        p("Intelligence layer for all Apex products. Shows trends in ratings, sentiment, review volume, Q&A topics, UGC performance, and competitive benchmarking (paid tier). Primary weekly intelligence source for brand Heads of eCommerce."),
        h2("Free vs Paid Tier"),
        b("Free: 30-day lookback, basic sentiment, review volume, top keywords"),
        b("Paid (Q3 2026, ₹2.5 L/year standalone): 12-month lookback, competitive benchmarking, AI weekly digest email, custom alerts, data export API"),
        b("DAU: 138 users from 47 clients. 3.2 sessions/user/week."),
        h2("H2 2026 Roadmap"),
        n("Paid tier launch — Q3 2026 (target ₹3 Cr ARR from upsell by Dec 2026)"),
        n("Analytics Export API < 1s — August 2026 (committed to Walmart India)"),
        n("AI weekly digest: Claude-generated insight email every Monday — Q3 2026"),
        n("Custom alerts: Brand sets threshold → instant notification — Q3 2026"),
        h2("Key Decisions"),
        b("Decision (Jan 2026): Analytics Dashboard is the FY2026 upsell anchor — approved by Vikram Nair and Priya Mehta. Every new enterprise contract includes free tier by default."),
        b("Decision (April 2026): Paid tier pricing ₹2.5 L/year standalone, ₹4 L/year bundled. Approved by Ananya Singh (CFO)."),
        b("Decision (April 2026): Paid tier launch delayed from Q2 to Q3 — competitive benchmarking data from Retail Intelligence (the key differentiator) is 6 weeks behind. Priya and Arjun agreed not to launch without it."),
      ],
    },
    {
      section: "Intelligence & Analytics",
      icon: "🔍",
      title: "Product: Retail Intelligence",
      blocks: [
        call("PM: Priyanka Jain · Stage: Beta · ARR: ₹0.6 Cr · Target GA: Q1 2027", "🔍"),
        h2("What it does"),
        p("Competitive benchmarking for brands. Shows how a brand's review score compares to competitors on the same retailer page — by category, product, and attribute. Sources: publicly available review data from Apex network."),
        h2("Value Proposition"),
        p("'You're 0.4 stars below category average on battery life — you're losing to OnePlus and Samsung on this attribute.' Brands currently have no way to know this without Retail Intelligence."),
        h2("Beta Status"),
        b("3 beta clients: boAt, Mamaearth, Himalaya. Categories: electronics, skincare, health."),
        h2("H2 2026 Roadmap"),
        n("Attribute-level benchmarking (compare 'battery life' score vs competitors) — Q3 2026"),
        n("Analytics Dashboard integration — Q4 2026"),
        n("Automated alerts: Competitor overtakes you on a key attribute — Q4 2026"),
        h2("Key Decisions"),
        b("Decision (Feb 2026): Only use publicly available Apex-network review data. NO web scraping of third-party platforms — legal flagged as ToS violation risk. Priyanka Jain + legal + Rahul Sharma. Non-negotiable."),
      ],
    },
    {
      section: "Intelligence & Analytics",
      icon: "🔎",
      title: "Product: Search & Discovery",
      blocks: [
        call("PM: Aakash Rao · Stage: Beta · ARR: ₹0.4 Cr · Target GA: Q2 2027", "🔎"),
        h2("What it does"),
        p("AI-powered semantic search within brand review databases. Shoppers search 'battery life reviews' or 'reviews mentioning fast delivery' and get semantically matched results. Powered by Voyage AI embeddings."),
        h2("Beta Status"),
        b("2 beta clients: Nykaa (beauty search), boAt (electronics)"),
        b("Embedding model: Voyage voyage-3-lite (512 dims). P99 latency: 180ms for 50K reviews."),
        b("Relevance score: 4.3/5 human evaluation on 100 test queries"),
        h2("H2 2026 Roadmap"),
        n("Review search widget for brand PDPs — Q3 2026"),
        n("Natural language filter: 'Show me 5-star reviews about packaging' → structured filter — Q3 2026"),
        n("Search analytics: What are shoppers searching for that they can't find? — Q4 2026"),
        h2("Key Decisions"),
        b("Decision (March 2026): Chose Voyage AI over OpenAI embeddings — better performance on product attribute queries in Aakash Rao's internal benchmark."),
      ],
    },
    {
      section: "Intelligence & Analytics",
      icon: "⚔️",
      title: "Product: Competitor Benchmarking",
      blocks: [
        call("PM: Rajesh Tiwari · Stage: Alpha (internal only) · Planned ARR: ₹2 Cr at GA", "⚔️"),
        h2("What it does"),
        p("Tracks competitors' review scores, volume, and sentiment trends across Apex network retailers. Will become a feature of Retail Intelligence and Analytics Dashboard paid tier."),
        h2("H2 2026 Roadmap"),
        n("Analytics Dashboard integration: Benchmarking tab in paid tier — Q4 2026"),
        n("Retail Intelligence integration — Q4 2026"),
        n("Automated competitive alerts — Q1 2027"),
        h2("Key Decisions"),
        b("Decision (March 2026): NO web scraping of external platforms. Only Apex network data in scope. Rajesh Tiwari + Priyanka Jain + legal sign-off. Non-negotiable."),
        b("Decision (April 2026): Competitor data shown at category level only in shared dashboards — prevents one client from reverse-engineering another's strategy. Privacy boundary set by Priya Mehta."),
      ],
    },
    {
      section: "Intelligence & Analytics",
      icon: "📡",
      title: "Product: Content Distribution",
      blocks: [
        call("PM: Anjali Malhotra · Stage: GA · ARR: ₹1.5 Cr", "📡"),
        h2("What it does"),
        p("Omnichannel publishing of review content. Pushes review snippets, ratings, and UGC to: email campaigns, Google Shopping (structured data), Meta catalogue, and offline digital signage via API."),
        h2("Active Channels"),
        b("Google Shopping: Structured data schema for review stars in search results — 23 brands."),
        b("Meta Product Catalogue: Review count and rating to Facebook/Instagram Shopping ads — 15 brands."),
        b("Email: Review snippet templates for Mailchimp, Klaviyo — 18 brands."),
        b("Digital Signage API: Retail stores display live review data on screens — 4 brands."),
        h2("H2 2026 Roadmap"),
        n("WhatsApp Business integration — Q3 2026"),
        n("Google Seller Ratings → Google Merchant Centre — Q3 2026"),
        n("Offline QR codes for packaging — Q4 2026"),
        h2("Key Decisions"),
        b("Decision (Jan 2026): Chose structured data approach for Google Shopping over Google's proprietary API — stable, free, no Google partnership approval required. Anjali Malhotra."),
      ],
    },
  ],

  "Platform & Infrastructure": [
    {
      section: "Platform & Infrastructure",
      icon: "🔐",
      title: "Product: Enterprise SSO & Admin",
      blocks: [
        call("PM: Tanvi Bhatt · Engineering: Deepa Reddy (priority) · GA: July 30, 2026 · P0 BLOCKER for 11 enterprise deals", "🔐"),
        h2("What it does"),
        p("Enterprise-grade identity and access management. SSO for Google Workspace, Okta, Azure AD. RBAC: Admin, PM, Analyst, Read-only. Audit log. User provisioning via SCIM 2.0."),
        h2("Why P0"),
        p("11 enterprise clients (Walmart India, Nykaa, Myntra, Flipkart, Croma, HDFC, and 5 pipeline deals) require Enterprise SSO before expanding. ₹6.5 Cr ARR expansion is blocked without it."),
        h2("Current Status — June 2026"),
        b("Development: 80% complete"),
        b("Google Workspace SSO: ✅ Complete in staging"),
        b("Okta: ✅ Complete in staging"),
        b("Azure AD: 🔄 70% — fixing metadata caching issue (ETA 10 days)"),
        b("GA: July 30, 2026 — 4 weeks behind original plan"),
        h2("Key Decisions"),
        b("Decision (May 2026): Dropped custom role builder for GA. Predefined roles sufficient. Custom roles pushed to Q4 2026. Ship GA first, customise later."),
        b("Decision (June 2026): Azure AD added to GA scope after Walmart India confirmed it as hard requirement. Deepa Reddy approved additional engineer allocation."),
        b("Risk: If Azure AD slips, offer Walmart India Google SSO as interim while Azure AD completes."),
      ],
    },
    {
      section: "Platform & Infrastructure",
      icon: "⚙️",
      title: "Product: API Developer Portal",
      blocks: [
        call("PM: Ishaan Chandra · Stage: In development · GA: Q4 2026 · Strategic: +₹3 Cr via channel partners", "⚙️"),
        h2("What it does"),
        p("Self-serve developer portal for Apex Commerce API access. Interactive docs, SDK downloads (Node.js, Python, Java), sandbox with test data, API key management, usage dashboard, webhook testing tools."),
        h2("Why Now"),
        p("Every API integration currently requires 2–4 weeks of Apex engineering. Developer Portal enables third-party developers to self-onboard. 3 channel partners signed LOI pending portal launch."),
        h2("H2 2026 Roadmap"),
        n("API documentation site (docs.apexcommerce.io) — Q3 2026"),
        n("Interactive API explorer — Q3 2026"),
        n("Node.js and Python SDKs — Q4 2026"),
        n("Sandbox with synthetic review data — Q4 2026"),
        n("GA + 3 channel partner onboarding — Q4 2026"),
        h2("Key Decisions"),
        b("Decision (Feb 2026): Chose Redocly for docs over Stoplight — better OpenAPI 3.1 support and search. ₹3.5 L/year enterprise plan. Ishaan Chandra."),
        b("Decision (March 2026): Free tier API (500 calls/day) requires no credit card — expected 8% conversion to paid. Approved by Sandeep Gupta + Ananya Singh."),
        b("Decision (June 2026): Portal name = 'Apex Developer Hub' at developer.apexcommerce.io. Keeps brand connection, no extra domain cost."),
      ],
    },
    {
      section: "Platform & Infrastructure",
      icon: "🌟",
      title: "Product: Influencer Hub",
      blocks: [
        call("PM: Pooja Iyer · Stage: Beta · ARR: ₹0.7 Cr · Target GA: Q4 2026", "🌟"),
        h2("What it does"),
        p("Platform for brands to manage creator campaigns that generate authentic UGC. Brands brief creators → creators submit content → moderated and tagged as 'Creator Review' → published with disclosure labels."),
        h2("Current Beta"),
        b("2 beta clients: Mamaearth (creator skincare reviews), boAt (unboxing videos)"),
        b("Creator network: 840 verified creators. Avg campaign: 50 creators, 180 pieces of content, 28 days."),
        h2("H2 2026 Roadmap"),
        n("Creator marketplace: Brands browse and invite creators — Q3 2026"),
        n("FTC disclosure automation: Auto-labels sponsored content — Q3 2026 (legal requirement)"),
        n("Nykaa Creator Club CSV import (350 creators) — August 2026 (committed)"),
        n("Performance analytics: ROI per creator campaign — Q4 2026"),
        h2("Key Decisions"),
        b("Decision (March 2026): All influencer content must be labelled 'Sponsored Review'. Non-negotiable FTC/legal requirement. Priya Mehta."),
        b("Decision (April 2026): Dropped micro-influencer auto-matching — algorithm matched irrelevant creators 30% of cases. Will revisit at 5,000 creator dataset."),
      ],
    },
    {
      section: "Platform & Infrastructure",
      icon: "📱",
      title: "Product: Social Commerce",
      blocks: [
        call("PM: Manish Kumar · Stage: Beta · ARR: ₹0.9 Cr · Instagram Shopping GA July 2026", "📱"),
        h2("What it does"),
        p("Connects Apex review content with social commerce channels — Instagram Shopping, WhatsApp Commerce, and TikTok Shop (paused). Brands push top-rated reviews to social product listings."),
        h2("Channel Status"),
        b("Instagram Shopping: GA July 2026 — review stars in Instagram product tags"),
        b("WhatsApp Commerce: Mamaearth pilot August 2026"),
        b("TikTok Shop: PAUSED — India regulatory situation unclear. Revisit Q1 2027."),
        h2("H2 2026 Roadmap"),
        n("Instagram Shopping GA — July 2026"),
        n("WhatsApp Commerce beta with Mamaearth — August 2026"),
        n("Social UGC import: Pull Instagram tagged posts into Visual UGC gallery — Q4 2026"),
        h2("Key Decisions"),
        b("Decision (June 2026): Paused TikTok Shop indefinitely. TikTok India regulatory status uncertain, government position shifted twice in 6 months. Vikram Nair and Rahul Sharma, June 5 leadership meeting."),
        b("Decision (April 2026): WhatsApp over SMS for D2C — WhatsApp open rate 94% vs SMS 35% in India. Manish Kumar analysis, Priya Mehta approved."),
      ],
    },
    {
      section: "Platform & Infrastructure",
      icon: "🏆",
      title: "Product: Loyalty & Rewards",
      blocks: [
        call("PM: Divya Sharma · Stage: Beta · ARR: ₹0.5 Cr · Target GA: Q1 2027", "🏆"),
        h2("What it does"),
        p("Incentivises authentic reviews through points and rewards. Shoppers earn points for reviews — redeemable as brand vouchers, discount codes, or cashback. Integrates with Nykaa Pink, boAt Tribe loyalty programmes."),
        h2("Why Now"),
        p("Review completion rate is the #1 ask from enterprise clients. Nykaa sees 78% of shoppers who start a review abandon before submitting. Loyalty incentive increases completion to 61% in pilot."),
        h2("H2 2026 Roadmap"),
        n("Nykaa Pink integration: Map Apex points to Nykaa's loyalty currency — Q3 2026"),
        n("Fraud detection for rewards: Prevent fake reviews for points abuse — Q3 2026 (critical)"),
        n("boAt Tribe integration — Q4 2026"),
        n("GA with 3 foundation clients — Q1 2027"),
        h2("Key Decisions"),
        b("Decision (April 2026): Points non-transferable, only redeemable on same brand — prevents secondary market. Divya Sharma + Ananya Singh (CFO)."),
        b("Decision (March 2026): Minimum 50 words to earn points — quality gate enforced by Review Engine."),
        b("Discovery (May 2026): Nykaa Pink points expire 12 months — will show 'valid 12 months' at point of earning rather than sending expiry emails. Divya Sharma."),
      ],
    },
  ],
};

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) { console.error("Missing env vars"); process.exit(1); }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: sources } = await supabase
    .from("sources")
    .select("metadata")
    .eq("provider", "notion")
    .in("status", ["connected", "syncing"])
    .limit(1);

  const token: string = sources?.[0]?.metadata?.access_token;
  if (!token) { console.error("No connected Notion source."); process.exit(1); }
  console.log("✓ Notion token found\n");

  // Use the user-created Apex Commerce page as root
  const rootId = "38d9534d-0520-8026-aeb5-f49e1ca0f6ae";
  console.log(`✓ Using Apex Commerce root: ${rootId}\n`);

  // Add an index block to the root page
  await notionPost(`/blocks/${rootId}/children`, token, {
    children: [
      call("Apex Commerce B2B SaaS — Commerce Content & Intelligence Platform · Series C · 210 employees", "🏢"),
      p("PM knowledge base. 5 sections · 25 documents covering stakeholders, strategy, OKRs, and all 20 products."),
      div(),
      h2("Sections"),
      b("📁 Company & Strategy — Vision, org structure, FY2026 strategy, H1 OKRs, stakeholder map"),
      b("📁 Core Platform Products — Ratings & Reviews API, Review Engine, Moderation Suite, Brand Portal, Review Widgets"),
      b("📁 Commerce & Growth Products — Visual UGC, Syndication, Q&A, Sampling & Advocacy, Checkout Optimization"),
      b("📁 Intelligence & Analytics — Analytics Dashboard, Retail Intelligence, Search & Discovery, Competitor Benchmarking, Content Distribution"),
      b("📁 Platform & Infrastructure — Enterprise SSO, API Developer Portal, Influencer Hub, Social Commerce, Loyalty & Rewards"),
    ],
  });

  // 2. Create 5 section pages under root, each with 5 content pages
  for (const [sectionTitle, pages] of Object.entries(PAGES)) {
    console.log(`\n=== ${sectionTitle} ===`);
    const sectionId = await createPage(token, rootId, sectionTitle, "📁", [
      p(`Section: ${sectionTitle} — ${pages.length} documents`),
    ]);
    if (!sectionId) continue;

    for (const page of pages) {
      await new Promise(r => setTimeout(r, 300));
      await createPage(token, sectionId, page.title, page.icon, page.blocks);
    }
  }

  console.log("\n\n═══════════════════════════════════════════════════════════════");
  console.log("DONE — Now do this:");
  console.log("");
  console.log("1. Go to Notion → you'll see 'Apex Commerce — PM Knowledge Base' in your sidebar");
  console.log("2. In Seam Integrations → Disconnect Notion → Reconnect");
  console.log("3. In the Notion OAuth page picker, select 'Apex Commerce — PM Knowledge Base'");
  console.log("   and check 'include all subpages'");
  console.log("4. Click Sync now → you should see 25+ docs indexed");
  console.log("═══════════════════════════════════════════════════════════════\n");
}

main().catch(e => { console.error(e); process.exit(1); });
