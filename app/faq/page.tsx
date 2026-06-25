"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ArrowRight, Shield, Zap, DollarSign, Database, Users, HelpCircle } from "lucide-react";

function SeamLogo() {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
      <span style={{ fontWeight: 900, fontSize: "20px", color: "#FFFFFF", letterSpacing: "-1px", fontFamily: "Inter, sans-serif", lineHeight: 1 }}>seam</span>
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#4F6BF5", display: "inline-block", marginBottom: "3px" }} />
    </div>
  );
}

// ── FAQ data ──────────────────────────────────────────────────────────────────

interface FaqItem { q: string; a: string; }
interface FaqGroup { id: string; label: string; icon: React.ElementType; color: string; items: FaqItem[]; }

const FAQ_GROUPS: FaqGroup[] = [
  {
    id: "security",
    label: "Data & Security",
    icon: Shield,
    color: "#34D399",
    items: [
      {
        q: "Is my company's internal data safe?",
        a: "Yes. Seam is read-only — we never write to your tools. Your documents are fetched during sync, chunked into small segments, converted into numerical embeddings (vectors), and stored in your own Supabase instance. The raw text of your documents is never stored by Seam — only the embeddings needed for search. Your data is processed in India (Mumbai region) and never leaves.",
      },
      {
        q: "Do you train your AI on my company's data?",
        a: "No, never. Seam uses Anthropic's Claude API to generate answers. Anthropic's API does not train on your inputs by default. Each query sends only the relevant retrieved context to Claude — not your entire workspace. Seam itself stores no query history unless you opt in via Settings.",
      },
      {
        q: "Who can see what? Can a junior PM accidentally access confidential docs?",
        a: "Access is tied to each user's Google OAuth login. Every user's connected sources are scoped to their own accounts — a junior PM can only search documents their own connected accounts have access to. Row-level security (RLS) in Supabase ensures strict data isolation between users. Team-level RBAC (role-based access control) is on the v2 roadmap.",
      },
      {
        q: "Is Seam SOC 2 or GDPR compliant?",
        a: "Seam is an early-stage product. The underlying data layer (Supabase) is SOC 2 Type II certified. Full SOC 2 compliance for Seam itself is planned post-Series A. For GDPR: your data is stored in the region you configure your Supabase project — EU users can choose an EU region. We don't transfer data outside your configured region.",
      },
    ],
  },
  {
    id: "integrations",
    label: "Integrations & Setup",
    icon: Database,
    color: "#60A5FA",
    items: [
      {
        q: "We use Confluence, not Notion — will Seam work for us?",
        a: "Confluence is on the integrations roadmap and uses the same OAuth 2.0 pattern as Notion, so the implementation is straightforward. The current v1 supports Notion, Jira, Slack, and Google Docs. If you're blocked on Confluence, reach out — it's the most-requested integration and will be prioritised.",
      },
      {
        q: "Our Jira is self-hosted (Data Center) — does OAuth support that?",
        a: "Not yet in v1. Current Jira OAuth assumes Jira Cloud. Self-hosted Jira Data Center uses a different OAuth 2.0 flow with a per-organisation base URL. This is a known gap — if your team is on Data Center, reach out and we'll prioritise it.",
      },
      {
        q: "How long does the initial sync take across thousands of documents?",
        a: "For most PM workspaces (a few hundred Notion pages, a few thousand Jira issues), sync completes in 10–20 minutes. Larger workspaces (5,000+ documents) can take up to an hour on first sync. Incremental syncs (after the first) are much faster — only new or updated documents are re-indexed. You'll see sync status in Integrations.",
      },
      {
        q: "What happens when a source goes offline or an OAuth token expires?",
        a: "Seam detects the failure at the next sync attempt and marks the source as errored. You'll see a banner in Settings with a one-click reconnect button. Your existing indexed documents remain searchable — the index doesn't get wiped when a token expires. Once you reconnect, a fresh incremental sync picks up any missed changes.",
      },
    ],
  },
  {
    id: "quality",
    label: "Answer Quality",
    icon: Zap,
    color: "#A78BFA",
    items: [
      {
        q: "How do I know the AI isn't hallucinating a decision that was never made?",
        a: "Every answer includes source cards — the actual documents Claude used to generate the answer. If a source card doesn't exist, a yellow warning banner tells you the answer is based on general knowledge, not your indexed docs. Phase 4 evals scored hallucination resistance at 4.68/5 across 20 realistic PM queries. The rule of thumb: if the source card doesn't back the claim, don't share the answer.",
      },
      {
        q: "If a document was updated, will the answer reflect the latest version?",
        a: "Yes — after the next sync. Source cards show \"synced Xh ago\" so you always know how fresh the data is. For time-sensitive information (e.g. a decision made yesterday), check the sync recency badge. Manual re-sync is available from Integrations at any time.",
      },
      {
        q: "Can I trust citations enough to share the answer with a stakeholder?",
        a: "Seam is designed exactly for that. Every answer has a \"Copy with citations\" button that formats the answer and all source cards (title, source, URL) for pasting into Slack or email. The source links are direct deep-links to the original documents — stakeholders can verify in one click.",
      },
    ],
  },
  {
    id: "value",
    label: "Value & ROI",
    icon: Users,
    color: "#FB923C",
    items: [
      {
        q: "I already have Confluence search and Slack search — why add Seam?",
        a: "Native search is keyword-only and siloed per tool — you search Confluence, then Slack, then Jira, then compare results manually. Seam runs a single query across all your sources simultaneously and returns one synthesised, cited answer. The difference is between \"find documents about X\" (native search) and \"tell me what was actually decided about X\" (Seam). For context switches that require synthesising across 3+ tools, Seam saves 20–30 minutes per query.",
      },
      {
        q: "What's the measurable time saved per week?",
        a: "The internal target is eliminating the 25-minute average context-switch cost per PM knowledge query (sourced from McKinsey PM productivity research). For a PM doing 3–5 of these queries per day, that's 75–125 minutes recovered daily — roughly 6–10 hours per week. At ₹800/month (~₹10/day), the ROI breaks even after recovering about 20 minutes of a PM's time per month.",
      },
      {
        q: "₹800/user/month — how do I justify this to my manager?",
        a: "Frame it as recovered decision speed, not tool cost. If a PM earns ₹15L/year, each hour is worth ~₹720. Seam recovering 1 hour/day = ₹15,000/month recovered per PM. At ₹800/month, that's an 18x ROI on day one. The harder number to ignore: a single missed stakeholder commitment or duplicated engineering effort from context loss costs orders of magnitude more than ₹800.",
      },
      {
        q: "Will my team actually use this or forget about it in a week?",
        a: "Retention depends on how quickly Seam answers a question that would otherwise have taken 20 minutes. The onboarding flow is designed to get you to your first useful answer within 5 minutes of connecting a source. Suggested queries on the home screen are pre-loaded with realistic PM questions to lower the activation energy. If your team doesn't find a genuine use in the first two weeks of the trial, we'll help you debug why — reach out.",
      },
    ],
  },
  {
    id: "pricing",
    label: "Pricing & Plans",
    icon: DollarSign,
    color: "#FCD34D",
    items: [
      {
        q: "Is the 14-day trial actually free with no credit card?",
        a: "Yes — sign up with Google, get full Pro access for 14 days, no card required. After 14 days you move to the free plan (1 source, 50 searches/month) automatically. No charges unless you explicitly upgrade.",
      },
      {
        q: "Is there a team plan for a 10-person PM org?",
        a: "Yes — the Team plan at ₹600/user/month (min 3 users, billed annually) includes shared workspace indexing, team search history, and admin connector management. A team of 10 PMs sharing one Notion and one Jira workspace indexes once and everyone searches the same index. Contact us to set up a team trial.",
      },
      {
        q: "What if Seam shuts down — can I export my data?",
        a: "Your source documents live in your own tools (Notion, Jira, etc.) — Seam never owns them. The indexed chunks and embeddings in Supabase can be exported as a standard Postgres dump at any time. You own your data completely. If Seam shuts down, your underlying tools are unaffected.",
      },
    ],
  },
  {
    id: "support",
    label: "Support & SLA",
    icon: HelpCircle,
    color: "#818CF8",
    items: [
      {
        q: "How do I get support if something breaks?",
        a: "Email hello@seam.so for any issue. Pro users get a response within 24 hours on business days. Team plan users get a dedicated Slack channel and same-day response. For urgent issues (sync failures, auth errors), the Settings page surfaces the specific error and a one-click fix for most common cases.",
      },
      {
        q: "Is there an uptime SLA?",
        a: "Seam is deployed on Vercel (99.9% uptime SLA) with Supabase as the database layer (99.9% uptime). Contractual SLAs for Seam itself are available on the Team plan. A public status page is coming in v2.",
      },
    ],
  },
];

// ── Accordion item ────────────────────────────────────────────────────────────

function AccordionItem({ item, isLast }: { item: FaqItem; isLast: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.06)" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "16px",
          padding: "16px 0",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <span style={{ fontSize: "14px", fontWeight: 600, color: open ? "#FFFFFF" : "rgba(255,255,255,0.82)", lineHeight: 1.45, flex: 1, transition: "color 0.15s" }}>
          {item.q}
        </span>
        <ChevronDown
          size={16}
          style={{
            color: "rgba(255,255,255,0.35)",
            flexShrink: 0,
            marginTop: "2px",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        />
      </button>

      <div
        style={{
          overflow: "hidden",
          maxHeight: open ? "600px" : "0",
          transition: "max-height 0.25s ease",
        }}
      >
        <p style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.5)", lineHeight: 1.75, paddingBottom: "16px" }}>
          {item.a}
        </p>
      </div>
    </div>
  );
}

// ── Group card ────────────────────────────────────────────────────────────────

function FaqGroupCard({ group }: { group: FaqGroup }) {
  const Icon = group.icon;
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "16px",
        padding: "24px 24px 8px",
        marginBottom: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "9px",
            background: `${group.color}14`,
            border: `1px solid ${group.color}28`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={14} style={{ color: group.color }} strokeWidth={2} />
        </div>
        <span style={{ fontSize: "12px", fontWeight: 700, color: group.color, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          {group.label}
        </span>
      </div>

      <div>
        {group.items.map((item, i) => (
          <AccordionItem key={i} item={item} isLast={i === group.items.length - 1} />
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FaqPage() {
  const totalQuestions = FAQ_GROUPS.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <div style={{ background: "#0F1117", minHeight: "100vh", fontFamily: "Inter, -apple-system, sans-serif", color: "white" }}>

      {/* Navbar */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <SeamLogo />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <Link href="/pricing" style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", textDecoration: "none", fontWeight: 500 }}>Pricing</Link>
          <Link href="/roadmap" style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", textDecoration: "none", fontWeight: 500 }}>Roadmap</Link>
          <Link href="/login" style={{ fontSize: "13px", background: "#4F6BF5", color: "white", textDecoration: "none", padding: "8px 16px", borderRadius: "9px", fontWeight: 600, boxShadow: "0 2px 12px rgba(79,107,245,0.35)" }}>
            Get started free
          </Link>
        </div>
      </nav>

      {/* Header */}
      <section style={{ textAlign: "center", padding: "64px 24px 48px", maxWidth: "680px", margin: "0 auto" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "#4F6BF5", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>
          FAQ
        </p>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 900, color: "#FFFFFF", letterSpacing: "-2px", lineHeight: 1.1, marginBottom: "14px" }}>
          Honest answers<br /><span style={{ color: "#4F6BF5" }}>to hard questions.</span>
        </h1>
        <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.38)", lineHeight: 1.65, maxWidth: "480px", margin: "0 auto" }}>
          {totalQuestions} questions PM teams ask before buying — answered straight, no marketing speak.
        </p>

        {/* Category pill nav */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px", marginTop: "32px" }}>
          {FAQ_GROUPS.map((g) => (
            <a
              key={g.id}
              href={`#${g.id}`}
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: g.color,
                background: `${g.color}12`,
                border: `1px solid ${g.color}25`,
                borderRadius: "20px",
                padding: "5px 13px",
                textDecoration: "none",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = `${g.color}20`)}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = `${g.color}12`)}
            >
              {g.label}
            </a>
          ))}
        </div>
      </section>

      {/* FAQ groups */}
      <section style={{ maxWidth: "720px", margin: "0 auto", padding: "0 24px 80px" }}>
        {FAQ_GROUPS.map((group) => (
          <div key={group.id} id={group.id}>
            <FaqGroupCard group={group} />
          </div>
        ))}
      </section>

      {/* Still have questions banner */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(79,107,245,0.04)", padding: "56px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.8px", marginBottom: "10px" }}>
          Still have a question?
        </h2>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.38)", marginBottom: "24px", lineHeight: 1.6 }}>
          We reply to every email. For anything not covered here, reach out directly.
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
          <a
            href="mailto:hello@seam.so"
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "12px 24px", borderRadius: "11px",
              background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.75)",
              textDecoration: "none", fontSize: "13.5px", fontWeight: 600,
              border: "1px solid rgba(255,255,255,0.12)", fontFamily: "Inter, sans-serif",
            }}
          >
            hello@seam.so
          </a>
          <Link
            href="/login"
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "12px 24px", borderRadius: "11px",
              background: "#4F6BF5", color: "white",
              textDecoration: "none", fontSize: "13.5px", fontWeight: 600,
              boxShadow: "0 4px 20px rgba(79,107,245,0.35)", fontFamily: "Inter, sans-serif",
            }}
          >
            Start free trial
            <ArrowRight size={15} strokeWidth={2.5} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 40px", borderTop: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap", gap: "12px" }}>
        <SeamLogo />
        <div style={{ display: "flex", gap: "24px" }}>
          {[["Pricing", "/pricing"], ["Roadmap", "/roadmap"], ["FAQ", "/faq"], ["Privacy", "#"], ["Terms", "#"]].map(([label, href]) => (
            <Link key={label} href={href} style={{ fontSize: "12px", color: "rgba(255,255,255,0.28)", textDecoration: "none" }}>{label}</Link>
          ))}
        </div>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.18)" }}>© 2026 Seam. Made for PMs.</p>
      </footer>
    </div>
  );
}
