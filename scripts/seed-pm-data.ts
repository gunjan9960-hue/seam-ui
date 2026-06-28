#!/usr/bin/env npx tsx
/**
 * Seam — Synthetic PM Data Seeder
 *
 * Creates 6 realistic PM documents in Notion automatically.
 * Outputs 6 Slack messages to paste manually (no chat:write scope).
 *
 * Run: npx tsx scripts/seed-pm-data.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// ── Load .env.local ───────────────────────────────────────────────────────────

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

const SUPABASE_URL   = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const NOTION_VERSION = "2022-06-28";

// ── Notion block helpers ──────────────────────────────────────────────────────

const h2 = (text: string) => ({
  object: "block", type: "heading_2",
  heading_2: { rich_text: [{ type: "text", text: { content: text } }] },
});

const p = (text: string) => ({
  object: "block", type: "paragraph",
  paragraph: { rich_text: [{ type: "text", text: { content: text } }] },
});

const bullet = (text: string) => ({
  object: "block", type: "bulleted_list_item",
  bulleted_list_item: { rich_text: [{ type: "text", text: { content: text } }] },
});

const callout = (text: string, emoji: string) => ({
  object: "block", type: "callout",
  callout: {
    rich_text: [{ type: "text", text: { content: text } }],
    icon: { type: "emoji", emoji },
  },
});

const divider = () => ({ object: "block", type: "divider", divider: {} });

// ── 6 synthetic PM documents ──────────────────────────────────────────────────

const PAGES = [
  {
    title: "Build vs Buy: Notification System — Decision Record",
    blocks: [
      callout("Decision: Build in-house. Approved by Rohit Gupta on September 12, 2024.", "✅"),
      h2("Context"),
      p("The product team evaluated whether to build our own notification infrastructure or adopt a third-party solution. Evaluation ran August–September 2024, led by Priya Sharma (Engineering Lead)."),
      h2("Options Considered"),
      bullet("Build in-house — full control, 6-week estimate for v1, flexible for our event model"),
      bullet("Sendbird — $8,000/month at projected scale, limited customisation on trigger logic"),
      bullet("OneSignal — free tier too limited; enterprise tier at $500/month with data residency concerns"),
      h2("Why We Chose to Build"),
      p("(1) Our notification logic is deeply tied to our internal event model — integrating any third-party would require custom middleware that negates the cost saving. (2) Engineering estimated 6 weeks to build v1 vs 4 weeks to integrate plus ongoing vendor maintenance. (3) At projected scale, OneSignal Enterprise becomes more expensive than in-house by month 18."),
      h2("Decision & Sign-Off"),
      bullet("Decision owner: Priya Sharma (Engineering Lead)"),
      bullet("Date: September 12, 2024"),
      bullet("Ratified by: Rohit Gupta (CEO), Ananya Krishnan (Head of Product)"),
      divider(),
      h2("Revisit Criteria"),
      p("Revisit if: (a) build exceeds 10 weeks, (b) notification failure rate exceeds 2%, or (c) a third-party reduces TCO by more than 40% over 2 years."),
    ],
  },
  {
    title: "Search Feature PRD v2.0",
    blocks: [
      callout("Status: In Development | Owner: Ananya Krishnan | Target: Q4 2024", "📋"),
      h2("Problem"),
      p("Users cannot find content created more than 30 days ago without remembering the exact page title. 68% of support tickets relate to discoverability. Current keyword search returns no ranked relevance and misses semantically related content."),
      h2("Goals"),
      bullet("P0 — Semantic full-text search across Notion + Slack in a single result set"),
      bullet("P0 — Results ranked by recency and relevance signal (not just keyword match)"),
      bullet("P1 — Filter by content type: docs, decisions, commitments, meeting notes"),
      bullet("P2 — Search scoped to a single project or team"),
      h2("Acceptance Criteria"),
      bullet("P50 query latency < 800ms, P95 < 2s"),
      bullet("Top-3 recall rate ≥ 80% on internal QA test set of 50 representative queries"),
      bullet("Works across Notion pages and Slack threads in unified results"),
      bullet("Zero hallucination: every cited answer links to a real indexed document"),
      h2("Out of Scope"),
      bullet("Real-time streaming results (deferred to v3)"),
      bullet("Search within file attachments (deferred to v3)"),
      bullet("Cross-workspace search across multiple company Notion workspaces"),
      h2("Technical Approach"),
      p("pgvector on Supabase for embedding storage. Model: text-embedding-3-small (1536 dims). Cosine similarity retrieval with 0.65 score threshold. Re-ranking uses Claude with a structured citation prompt. MCP protocol for live Notion and Slack retrieval at query time."),
    ],
  },
  {
    title: "Enterprise Pilot — Q3 2024 Commitments Tracker",
    blocks: [
      callout("All enterprise commitments live here. Update after every customer call. Owner: Ananya Krishnan.", "🤝"),
      h2("Acme Corp"),
      bullet("✅ COMMITTED: SSO via SAML 2.0 by October 31, 2024 — Owner: Dev team"),
      bullet("✅ COMMITTED: Audit log export (CSV) by November 15, 2024 — Owner: Ananya"),
      bullet("✅ COMMITTED: Dedicated support SLA (4h response) from November 1 — Owner: CS"),
      bullet("Status: SSO in development, audit log scoped, SLA contract in legal review"),
      divider(),
      h2("TechFlow Inc"),
      bullet("✅ DELIVERED: Notion integration working by end of September — shipped Sept 28"),
      bullet("✅ COMMITTED: Slack integration by October 15, 2024 — Owner: Dev team (on track)"),
      bullet("✅ COMMITTED: Custom data retention policy (90-day rolling delete) by Q4 — Owner: Dev"),
      divider(),
      h2("GlobalPM Ltd"),
      bullet("⏸️ DEFERRED: White-label option review — pushed to Q1 2025"),
      p("Rohit spoke to GlobalPM on September 30. They agreed to revisit white-label in Q1 2025 after we reach 500 MAU. No penalty for deferral — documented in call notes."),
      divider(),
      h2("Commitment Rules"),
      bullet("No engineering commitment without Priya's sign-off"),
      bullet("No pricing commitment without Rohit's sign-off"),
      bullet("All commitments must be logged here within 24h of the call"),
    ],
  },
  {
    title: "New PM Onboarding Guide — First 30 Days",
    blocks: [
      callout("Welcome to the product team! Use Seam (connect Notion + Slack) to search everything in this guide.", "🚀"),
      h2("Week 1: Context Building"),
      bullet("Read the company strategy doc — Notion > Strategy > Company Vision 2024"),
      bullet("Review the last 2 quarters of OKR documents (Notion > OKRs)"),
      bullet("Shadow 2 customer calls — coordinate with CS team in #customer-success"),
      bullet("Set up Seam: connect Notion + Slack from the Integrations tab"),
      bullet("Read the H2 Roadmap decisions doc to understand what was cut and why"),
      h2("Week 2: Product Deep Dive"),
      bullet("Read all live PRDs — Notion > Product > PRDs folder"),
      bullet("Walk through the current sprint with Priya Sharma (Engineering Lead)"),
      bullet("Review the decision log to understand past build vs buy choices"),
      bullet("Attend weekly product sync (Mondays 10am) and engineering standup (daily 9:30am)"),
      h2("Key People"),
      bullet("Rohit Gupta — CEO. Final call on roadmap priority and enterprise commitments"),
      bullet("Priya Sharma — Engineering Lead. Owns all technical architecture decisions"),
      bullet("Ananya Krishnan — Head of Product. Your manager. Owns PRDs and roadmap"),
      bullet("CS team — in #customer-success Slack channel"),
      h2("Key Channels"),
      bullet("#product-decisions — all significant product decisions logged here"),
      bullet("#engineering — technical discussions and sprint updates"),
      bullet("#customer-success — customer escalations and enterprise updates"),
      h2("30-Day Goal"),
      p("By day 30 you should be able to answer these without asking anyone: (1) Why did we deprioritise mobile from the H2 roadmap? (2) What are the top enterprise commitments this quarter? (3) Why did we choose to build the notification system in-house? Use Seam to find all of these."),
    ],
  },
  {
    title: "H2 2024 Roadmap — What Was Cut and Why",
    blocks: [
      callout("This is the authoritative record of H2 deprioritisations. Updated after each planning session.", "📍"),
      h2("Cut: Mobile App (iOS + Android)"),
      p("Decision date: July 8, 2024. Decision owner: Rohit Gupta + Ananya Krishnan."),
      p("Mobile was fully scoped for H2 but deprioritised for three reasons: (1) Two senior engineers left in June — net headcount down 25% and remaining capacity needed for Search v2. (2) Usage data shows our web session average is 22 minutes — our users are desktop-first PMs, not field workers. (3) Building mobile would push Search v2 by 2 quarters. Search drives activation more directly than mobile."),
      p("Mobile goes back on the roadmap in H1 2025 planning if we hit 1,000 MAU on web."),
      divider(),
      h2("Cut: Public API v2 Launch"),
      p("API v2 is code-complete. Public launch postponed due to: legal requires updated ToS and a third-party security audit before we expose external APIs. ETA for legal sign-off: November 2024. Engineering is ready. Do not commit this to customers until legal clears it."),
      divider(),
      h2("Cut: Offline Mode"),
      p("Offline mode was in the H2 spec but removed at the August 5 planning session. Core reason: 95% of active users are in connectivity-rich office environments. Implementation adds 3 months of complexity for < 5% of use cases. Revisit in 2025 if enterprise customers specifically request it."),
      divider(),
      h2("What Shipped in H2"),
      bullet("✅ Search v2 with semantic retrieval — shipped October 2024"),
      bullet("✅ Notion integration via MCP — shipped September 2024"),
      bullet("✅ Slack integration via MCP — shipped October 2024"),
      bullet("🔄 Enterprise SSO (SAML 2.0) — in progress, ETA November 2024"),
      bullet("🔄 Audit log export — in progress, ETA November 2024"),
    ],
  },
  {
    title: "Pricing Model Decision — August 2024",
    blocks: [
      callout("Decision: Freemium with usage-based upsell. Signed off by Rohit Gupta on August 20, 2024.", "💰"),
      h2("Options Evaluated"),
      bullet("Flat-rate: $49/user/month — predictable revenue but high churn risk at low initial usage"),
      bullet("Pure usage-based: charge per query above a free tier — aligns cost to value, hard to forecast"),
      bullet("Freemium: free up to 50 queries/month, $29/month for unlimited — chosen model"),
      h2("Why Freemium"),
      p("(1) PM tool adoption is habit-driven. Users need to integrate Seam into daily workflow before they feel the pain of a limit — freemium gives them that chance. (2) 50 queries/month covers casual use and forces upgrade only at the point of proven value. (3) Competitive analysis: Notion, Linear, and Coda all use freemium with 8–12% free-to-paid conversion rates. We are targeting 10%."),
      h2("Pricing Structure"),
      bullet("Free — 1 workspace, 2 integrations, 50 queries/month, community support"),
      bullet("Pro — $29/month, unlimited queries, 5 integrations, email support, priority indexing"),
      bullet("Enterprise — custom pricing, SSO (SAML), audit logs, SLA, dedicated support"),
      h2("Sign-Off"),
      bullet("Rohit Gupta (CEO) — Approved August 20, 2024"),
      bullet("Ananya Krishnan (Head of Product) — Approved August 18, 2024"),
      bullet("Reviewed by: Vikram Nair (Finance), Priya Sharma (Engineering)"),
      divider(),
      p("Do NOT quote pricing outside this model to any customer or press before the public pricing page launches. Direct all pricing questions to Rohit."),
    ],
  },
];

// ── Slack content to paste manually ──────────────────────────────────────────

const SLACK_MESSAGES = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SLACK MESSAGES — paste into #product-decisions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create a channel called #product-decisions in your Slack workspace,
then paste each message below as a separate message in that channel.

─── Message 1 ───────────────────────────
📌 Decision logged: We're building the notification system in-house — not buying Sendbird or OneSignal.
Decision by Priya (Eng Lead), sign-off from Rohit and Ananya.
Core reason: our notification logic is too custom for any third-party template, and OneSignal Enterprise is more expensive than in-house by month 18.
Full rationale in Notion → "Build vs Buy: Notification System — Decision Record"

─── Message 2 ───────────────────────────
Q3 Enterprise commitments update 📋
• Acme Corp: SSO by Oct 31 ✅ on track, audit log by Nov 15 ✅ on track
• TechFlow: Notion delivered ✅, Slack integration by Oct 15 (in dev), data retention by Q4 end
• GlobalPM: white-label review pushed to Q1 2025 — Rohit aligned with them, no penalty

All commitments and owners are tracked in Notion → "Enterprise Pilot — Q3 2024 Commitments Tracker"
If you touch any of these deliverables, check that doc first.

─── Message 3 ───────────────────────────
H2 roadmap update — what's been deprioritised and why 🗂️

Mobile app: officially cut. Two engineers left in June, and usage data shows 22min avg web sessions — our users are desktop-first. Building mobile would delay Search v2 by 2 quarters.

API v2 public launch: code is done, but legal needs to clear ToS + security audit before we expose external APIs. Engineering is blocked on compliance, not capability.

Offline mode: cut. 95% of our users are in office environments. 3 months of work for <5% of use cases. Revisit 2025 if enterprise asks for it.

Full doc in Notion → "H2 2024 Roadmap — What Was Cut and Why"

─── Message 4 ───────────────────────────
Pricing model finalised ✅

We're going freemium:
• Free: 50 queries/month, 2 integrations
• Pro: $29/month, unlimited
• Enterprise: custom, SSO + audit logs

Rohit signed off August 20. Do NOT quote any other number to customers or press.
Full reasoning in Notion → "Pricing Model Decision — August 2024"

─── Message 5 ───────────────────────────
New PM joining Monday 👋

Please make sure they get access to:
- Notion workspace (ask Ananya)
- Channels: #product-decisions, #engineering, #customer-success
- Seam: connect Notion + Slack in the Integrations tab

Onboarding guide is in Notion → "New PM Onboarding Guide — First 30 Days"
30-day goal: they should be able to answer our top product questions using Seam alone.

─── Message 6 ───────────────────────────
Search v2 is live 🎉

Semantic search across Notion + Slack. Cited answers. Every result links to source.
Try: "Why did we cut mobile from H2?" or "What did we commit to Acme Corp?"

If you find a query that returns wrong results or no results, drop it in #product-feedback.
PRD is in Notion → "Search Feature PRD v2.0"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  END SLACK CONTENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

// ── Notion API helpers ────────────────────────────────────────────────────────

function notionHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
}

interface NotionPage {
  id?: string;
  url?: string;
  object?: string;
  message?: string;
}

async function searchForParentPage(token: string): Promise<string | null> {
  const res = await fetch("https://api.notion.com/v1/search", {
    method: "POST",
    headers: notionHeaders(token),
    body: JSON.stringify({ filter: { value: "page", property: "object" }, page_size: 3 }),
  });
  const data = await res.json() as { results?: NotionPage[] };
  const pages = (data.results ?? []).filter((r) => r.object === "page" && r.id);
  return pages[0]?.id ?? null;
}

async function createPage(
  token: string,
  parentId: string | null,
  title: string,
  blocks: unknown[],
): Promise<NotionPage> {
  const parent = parentId
    ? { type: "page_id", page_id: parentId }
    : { type: "workspace", workspace: true };

  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: notionHeaders(token),
    body: JSON.stringify({
      parent,
      properties: {
        title: { title: [{ type: "text", text: { content: title } }] },
      },
      children: blocks.slice(0, 100), // Notion API max 100 blocks per request
    }),
  });

  const data = await res.json() as NotionPage;
  if (!res.ok) throw new Error((data as { message?: string }).message ?? JSON.stringify(data));
  return data;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🧵  Seam — Synthetic PM Data Seeder\n");

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: sources, error } = await supabase
    .from("sources")
    .select("provider, metadata");

  if (error) {
    console.error("❌  Supabase error:", error.message);
    process.exit(1);
  }

  const notionToken = (sources ?? [])
    .find((s) => s.provider === "notion")
    ?.metadata?.access_token as string | undefined;

  // ── Notion ──────────────────────────────────────────────────────────────────

  if (!notionToken) {
    console.log("⚠️   No Notion token found.\n    Connect Notion first from the Integrations page, then re-run this script.\n");
  } else {
    console.log("📘  Creating Notion pages…\n");

    // Find a parent page to nest everything under
    let parentId: string | null = null;
    try {
      parentId = await searchForParentPage(notionToken);
      if (parentId) {
        console.log(`    Found parent page → using as container\n`);
      } else {
        console.log(`    No accessible pages found — creating at workspace root\n`);
      }
    } catch {
      console.log("    Could not determine parent, trying workspace root\n");
    }

    let created = 0;
    let failed  = 0;

    for (const page of PAGES) {
      try {
        const result = await createPage(notionToken, parentId, page.title, page.blocks);
        console.log(`    ✅  ${page.title}`);
        if (result.url) console.log(`        ${result.url}`);
        created++;
      } catch (err) {
        console.log(`    ❌  ${page.title}`);
        console.log(`        ${err instanceof Error ? err.message : String(err)}`);
        failed++;
      }
    }

    console.log(`\n    ${created} pages created, ${failed} failed`);

    if (created > 0) {
      console.log("\n💡  Sync Notion in Seam:");
      console.log("    Integrations → Notion → Sync now");
    }
  }

  // ── Slack ───────────────────────────────────────────────────────────────────

  console.log(SLACK_MESSAGES);

  // ── Test queries ─────────────────────────────────────────────────────────────

  console.log("🔍  Test these queries in Seam after syncing:\n");
  const queries = [
    "Why did we decide to build the notification system in-house?",
    "What are our enterprise pilot commitments for Q3?",
    "Why was mobile deprioritised from the H2 roadmap?",
    "What are the acceptance criteria for the search feature?",
    "Walk me through the new PM onboarding process",
    "What pricing model did we choose and why?",
    "What did we commit to Acme Corp?",
    "Who signed off on the pricing decision?",
  ];
  for (const q of queries) {
    console.log(`    • "${q}"`);
  }
  console.log("");
}

main().catch((err) => {
  console.error("\nFatal:", err);
  process.exit(1);
});
