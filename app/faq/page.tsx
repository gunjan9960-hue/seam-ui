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
        a: "Yes. Seam is read-only — we never write to your tools. When you ask a question, Seam fetches only the relevant content from your connected sources in real time. Raw document text is never stored by Seam. Your content is processed ephemerally and discarded after each response.",
      },
      {
        q: "Do you train your AI on my company's data?",
        a: "No, never. Seam uses Anthropic's Claude API to generate answers. Anthropic does not train on API inputs by default. Each query sends only the relevant retrieved context to Claude for that moment — your workspace content is never retained or used to train any model.",
      },
      {
        q: "Who can see what? Can a junior PM accidentally access confidential docs?",
        a: "Access is tied to each user's Google OAuth login. Every user's connected sources are scoped to their own accounts — a junior PM can only search documents their own connected accounts have access to. Row-level security (RLS) in Supabase ensures strict data isolation between users.",
      },
      {
        q: "Is Seam SOC 2 compliant?",
        a: "Seam is an early-stage product. The underlying data layer (Supabase) is SOC 2 Type II certified. Full SOC 2 compliance for Seam itself is on the roadmap. Your document content is never stored by Seam — only OAuth tokens (encrypted) and your profile are retained.",
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
        q: "What does Seam connect to today?",
        a: "Seam currently connects to Notion and Slack via live MCP (Model Context Protocol) — meaning every search queries your sources in real time with no indexing lag. Your content is never copied into a Seam-owned database; it stays in your tools and is read live on every search.",
      },
      {
        q: "How does live MCP search work?",
        a: "Instead of batch-indexing your content and searching a cached copy, Seam queries Notion and Slack directly at the moment you ask a question, via their official hosted MCP servers. The benefit: answers always reflect the latest state of your workspace. No sync delays, no stale results.",
      },
      {
        q: "We use Jira or Confluence — will Seam support those?",
        a: "Jira and Confluence are on the near-term roadmap. Today, Seam works with Notion and Slack — where most PM decisions live for the teams we built this for. If you're blocked on Jira, reach out — it's the most-requested integration.",
      },
      {
        q: "What happens when a source goes offline or an OAuth token expires?",
        a: "Seam detects the failure at query time and falls back to any remaining available sources. You'll see a reconnect prompt in Integrations. Reconnecting takes under 30 seconds and restores full live search immediately.",
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
        q: "How do I know the AI isn't making up a decision that was never made?",
        a: "Every answer includes source cards — the actual documents and threads Claude used to generate the answer. If the source card doesn't exist for a claim, don't share the answer. Our internal evals scored hallucination resistance at 4.68/5 across 20 realistic PM queries. The system is designed to say nothing rather than invent.",
      },
      {
        q: "Will answers reflect the latest version of a document?",
        a: "Yes — Seam queries your sources live at the time of every search. There is no batch-sync delay. If you updated a Notion page 5 minutes ago, the next query will read the updated version.",
      },
      {
        q: "Can I share the answer with a stakeholder?",
        a: "Yes. Every answer shows which sources were used — the document or Slack thread title and the name of the connected workspace. Source links go directly back to the original content so stakeholders can verify in one click.",
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
        q: "I already have Notion search and Slack search — why add Seam?",
        a: "Native search is keyword-only and siloed per tool — you search Notion, then Slack, then manually compare. Seam runs a single natural language query across all your connected sources simultaneously and returns one synthesised, cited answer. The difference is between \"find documents about X\" and \"tell me what was actually decided about X.\" For any question that spans multiple tools, Seam saves 20–30 minutes per query.",
      },
      {
        q: "What's the measurable time saved?",
        a: "PMs lose an average of 25 minutes per context switch when hunting across tools for past decisions. For a PM doing 3–5 of these queries per day, that's 75–125 minutes recovered daily — roughly 6–10 hours per week. Seam is designed to close that gap.",
      },
      {
        q: "What kind of questions is Seam best at?",
        a: "Seam is built for PM-native queries: Decision Recall (\"Why did we descope SSO?\"), Spec Lookup (\"What are the billing specs?\"), Stakeholder Commitments (\"What did we promise Acme Corp?\"), and Onboarding (\"Walk me through the auth flow decisions\"). It's optimised for the questions PMs actually ask — not general-purpose chat.",
      },
    ],
  },
  {
    id: "beta",
    label: "Beta & Pricing",
    icon: DollarSign,
    color: "#FCD34D",
    items: [
      {
        q: "Is Seam free right now?",
        a: "Yes — Seam is in beta. Sign in with Google and connect Notion or Slack for free. No credit card required. Pricing will be introduced later; early users will receive advance notice before anything changes.",
      },
      {
        q: "What if Seam shuts down — can I export my data?",
        a: "Your documents live in Notion and Slack — Seam searches them live and never stores copies. If Seam shuts down tomorrow, your underlying tools are completely unaffected. You own your data; we only ever read it.",
      },
    ],
  },
  {
    id: "support",
    label: "Support",
    icon: HelpCircle,
    color: "#818CF8",
    items: [
      {
        q: "How do I get help if something breaks?",
        a: "Email hello@seam.so for any issue. We reply to every email. For common issues — sync failures, auth errors, reconnecting a source — the Integrations and Settings pages surface the error and a one-click fix for most cases.",
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
            color: "rgba(255,255,255,0.6)",
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
          <Link href="/about" style={{ fontSize: "13px", color: "rgba(255,255,255,0.72)", textDecoration: "none", fontWeight: 500 }}>About</Link>
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
        <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.68)", lineHeight: 1.65, maxWidth: "480px", margin: "0 auto" }}>
          {totalQuestions} questions PM teams ask — answered straight, no marketing speak.
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
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.68)", marginBottom: "24px", lineHeight: 1.6 }}>
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
            Continue with Google
            <ArrowRight size={15} strokeWidth={2.5} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 40px", borderTop: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap", gap: "12px" }}>
        <SeamLogo />
        <div style={{ display: "flex", gap: "24px" }}>
          {[["About", "/about"], ["Privacy", "/privacy"], ["FAQ", "/faq"]].map(([label, href]) => (
            <Link key={label} href={href} style={{ fontSize: "12px", color: "rgba(255,255,255,0.62)", textDecoration: "none" }}>{label}</Link>
          ))}
        </div>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.52)" }}>© 2026 Seam. Made for PMs.</p>
      </footer>
    </div>
  );
}
