"use client";

import Link from "next/link";
import { Check, Clock, Zap, Lock } from "lucide-react";

// ── Data ──────────────────────────────────────────────────────────────────────

type Phase = "live" | "building" | "next" | "planned" | "post";

interface RoadmapItem {
  title: string;
  description: string;
  phase: Phase;
  tag?: string;
}

const MODULES: RoadmapItem[] = [
  {
    title: "Knowledge Search",
    description: "Cross-source cited answers across Notion, Jira, Google Docs, and Slack.",
    phase: "live",
    tag: "Core",
  },
  {
    title: "Query Intent Detection",
    description: "Seam classifies your query into 7 PM query types — Decision Recall, Spec Lookup, Onboarding, and more — to return sharper answers.",
    phase: "live",
    tag: "Core",
  },
  {
    title: "PM Morning Briefing",
    description: "One-screen daily briefing: meetings, Slack @mentions, Jira blockers, and docs needing review.",
    phase: "live",
    tag: "Dashboard",
  },
  {
    title: "Session Download",
    description: "Export any search session as Markdown with all citations as clickable links. PDF export coming next.",
    phase: "live",
    tag: "Sessions",
  },
  {
    title: "PRD Creator",
    description: "Generate structured PRDs from a brief or a set of Jira tickets. Exports directly to Notion or Google Docs.",
    phase: "next",
    tag: "Creation",
  },
  {
    title: "Query History",
    description: "Every search auto-saved with timestamp, query text, answer, and source cards. One click to reopen any past session.",
    phase: "next",
    tag: "Sessions",
  },
  {
    title: "Data App — Mixpanel",
    description: "Seam detects the feature in your query and pulls live Mixpanel metrics (adoption, retention, funnels) directly below your knowledge answer. No setup required.",
    phase: "next",
    tag: "Data",
  },
  {
    title: "Named Research Threads",
    description: "Name a session \"SSO Investigation\" or \"Q3 Roadmap Audit\" and resume it across multiple sittings with full context.",
    phase: "planned",
    tag: "Sessions",
  },
  {
    title: "Insight Generator",
    description: "Turn user interviews, support tickets, and Mixpanel data into structured insights ranked by frequency and impact.",
    phase: "next",
    tag: "Insights",
  },
  {
    title: "PDF Session Export",
    description: "Full session download as PDF with clickable source hyperlinks — designed for stakeholder sharing and onboarding handoffs.",
    phase: "planned",
    tag: "Sessions",
  },
  {
    title: "Team-Shared Threads",
    description: "Share a research thread with your team via a link. \"Here's everything I found on the billing decision\" — no Seam account needed to read.",
    phase: "planned",
    tag: "Collaboration",
  },
  {
    title: "Roadmap Builder",
    description: "RICE and MoSCoW prioritisation with AI scoring pulled from Jira, Mixpanel, and customer feedback.",
    phase: "post",
    tag: "Planning",
  },
  {
    title: "Adoption Tracker",
    description: "Link every shipped Jira ticket to its Mixpanel adoption curve. Close the loop from spec to impact.",
    phase: "post",
    tag: "Analytics",
  },
];

const CONNECTORS: RoadmapItem[] = [
  { title: "Notion",         description: "Pages, databases, comments — live via MCP",            phase: "live",     tag: "P0" },
  { title: "Slack",          description: "Public channels, threads, @mentions — live via MCP",   phase: "live",     tag: "P0" },
  { title: "Jira",           description: "Tickets, sprints, comments, custom fields",             phase: "next",     tag: "P1" },
  { title: "Google Docs",    description: "Docs, Sheets, Slides — full content + comments",       phase: "next",     tag: "P1" },
  { title: "Mixpanel",       description: "Event trends, funnels, retention",                      phase: "building", tag: "P0" },
  { title: "Confluence",     description: "Spaces, pages, inline comments",                        phase: "next",     tag: "P1" },
  { title: "Amplitude",      description: "Behavioral cohorts, DAU/MAU",                           phase: "planned",  tag: "P1" },
  { title: "Razorpay/Stripe",description: "MRR, ARR, churn, revenue per feature",                 phase: "planned",  tag: "P1" },
  { title: "Freshdesk",      description: "Support ticket volume by feature",                      phase: "planned",  tag: "P1" },
  { title: "Linear",         description: "Growing adoption in product-led startups",              phase: "planned",  tag: "P2" },
  { title: "GitHub",         description: "Engineering context for tech-PM queries",               phase: "planned",  tag: "P2" },
];

const PHASE_CONFIG: Record<Phase, { label: string; color: string; bg: string; border: string; icon: React.ElementType; dotColor: string }> = {
  live:     { label: "Live",        color: "#065F46", bg: "#ECFDF5", border: "#A7F3D0", icon: Check,  dotColor: "#10B981" },
  building: { label: "Building",    color: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE", icon: Zap,    dotColor: "#3B82F6" },
  next:     { label: "Up next",     color: "#92400E", bg: "#FFFBEB", border: "#FDE68A", icon: Clock,  dotColor: "#F59E0B" },
  planned:  { label: "Planned",     color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB", icon: Clock,  dotColor: "#D1D5DB" },
  post:     { label: "Post-launch", color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB", icon: Lock,   dotColor: "#D1D5DB" },
};

const PHASE_ORDER: Phase[] = ["live", "building", "next", "planned", "post"];

const PHASE_LABELS: Record<Phase, string> = {
  live:     "Now",
  building: "In progress",
  next:     "Up next — Q3 2026",
  planned:  "Planned — Q4 2026",
  post:     "Post-launch",
};

// ── Components ────────────────────────────────────────────────────────────────

function PhaseBadge({ phase }: { phase: Phase }) {
  const cfg = PHASE_CONFIG[phase];
  const Icon = cfg.icon;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "3px 8px",
        borderRadius: "100px",
        fontSize: "10.5px",
        fontWeight: 600,
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        fontFamily: "Inter, sans-serif",
        flexShrink: 0,
      }}
    >
      <Icon size={9} strokeWidth={2.5} />
      {cfg.label}
    </span>
  );
}

function RoadmapCard({ item }: { item: RoadmapItem }) {
  const cfg = PHASE_CONFIG[item.phase];
  const dimmed = item.phase === "planned" || item.phase === "post";
  return (
    <div
      style={{
        padding: "16px 18px",
        borderRadius: "14px",
        background: dimmed ? "#FAFAFA" : "#FFFFFF",
        border: `1px solid ${item.phase === "live" ? "#A7F3D0" : item.phase === "building" ? "#BFDBFE" : item.phase === "next" ? "#FDE68A" : "var(--border)"}`,
        boxShadow: dimmed ? "none" : "var(--shadow-card)",
        opacity: item.phase === "post" ? 0.65 : 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px", marginBottom: "7px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {item.tag && (
            <span style={{ fontSize: "9.5px", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "Inter, sans-serif" }}>
              {item.tag}
            </span>
          )}
        </div>
        <PhaseBadge phase={item.phase} />
      </div>
      <h3 style={{ fontSize: "14px", fontWeight: 700, color: dimmed ? "#6B7280" : "var(--text-primary)", marginBottom: "5px", letterSpacing: "-0.2px", fontFamily: "Inter, sans-serif" }}>
        {item.title}
      </h3>
      <p style={{ fontSize: "12.5px", color: "#6B7280", lineHeight: 1.6, fontFamily: "Inter, sans-serif" }}>
        {item.description}
      </p>
    </div>
  );
}

function Section({ phase, items }: { phase: Phase; items: RoadmapItem[] }) {
  if (!items.length) return null;
  const cfg = PHASE_CONFIG[phase];
  return (
    <div style={{ marginBottom: "40px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: cfg.dotColor, flexShrink: 0 }} />
        <h2 style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.10em", fontFamily: "Inter, sans-serif" }}>
          {PHASE_LABELS[phase]}
        </h2>
        <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "10px" }}>
        {items.map((item) => <RoadmapCard key={item.title} item={item} />)}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RoadmapPage() {
  const liveCount = MODULES.filter((m) => m.phase === "live").length;
  const totalCount = MODULES.length;

  return (
    <div style={{ background: "var(--surface)", minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>

      {/* Navbar */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 48px", borderBottom: "1px solid var(--border)", background: "#FFFFFF" }}>
        <Link href="/" style={{ display: "flex", alignItems: "baseline", gap: "3px", textDecoration: "none" }}>
          <span style={{ fontWeight: 900, fontSize: "20px", color: "#1C1E26", letterSpacing: "-1.2px", fontFamily: "Inter, sans-serif" }}>seam</span>
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#4F6BF5", display: "inline-block", marginBottom: "3px" }} />
        </Link>
        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          <Link href="/pricing" style={{ fontSize: "13px", color: "var(--text-secondary)", textDecoration: "none", fontWeight: 500 }}>Pricing</Link>
          <Link href="/login" style={{ fontSize: "13px", background: "#4F6BF5", color: "white", textDecoration: "none", padding: "8px 16px", borderRadius: "9px", fontWeight: 600 }}>
            Get early access →
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "48px 48px 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: "48px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#4F6BF5", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>
            Product Roadmap
          </p>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-1.5px", lineHeight: 1.1, marginBottom: "14px" }}>
            What we&apos;re building — and what&apos;s next.
          </h1>
          <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: "560px", marginBottom: "24px" }}>
            Seam ships fast. Every item here is driven by PMs who told us what slows them down.
            This is our public commitment.
          </p>

          {/* Progress bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", borderRadius: "12px", background: "#FFFFFF", border: "1px solid var(--border)", maxWidth: "400px", boxShadow: "var(--shadow-card)" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--text-primary)" }}>
                  {liveCount} of {totalCount} modules live
                </span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  {Math.round((liveCount / totalCount) * 100)}%
                </span>
              </div>
              <div style={{ height: "5px", borderRadius: "3px", background: "var(--border)", overflow: "hidden" }}>
                <div style={{ width: `${(liveCount / totalCount) * 100}%`, height: "100%", background: "#4F6BF5", borderRadius: "3px" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Feature tabs */}
        <div style={{ display: "flex", gap: "32px", marginBottom: "48px" }}>

          {/* Modules */}
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.4px", marginBottom: "24px" }}>
              Modules
            </h2>
            {PHASE_ORDER.map((phase) => {
              const items = MODULES.filter((m) => m.phase === phase);
              return <Section key={phase} phase={phase} items={items} />;
            })}
          </div>
        </div>

        {/* Connectors */}
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.4px", marginBottom: "24px" }}>
            Connectors
          </h2>
          {PHASE_ORDER.map((phase) => {
            const items = CONNECTORS.filter((c) => c.phase === phase);
            return <Section key={phase} phase={phase} items={items} />;
          })}
        </div>

        {/* Feedback CTA */}
        <div style={{ marginTop: "56px", padding: "32px 36px", borderRadius: "20px", background: "#FFFFFF", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)", textAlign: "center" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px", marginBottom: "8px" }}>
            Missing something?
          </h3>
          <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", marginBottom: "20px", lineHeight: 1.65 }}>
            Every item on this roadmap came from a PM request. If a tool you use or a feature you need isn&apos;t here — tell us.
          </p>
          <a
            href="mailto:hello@getseam.com?subject=Roadmap feedback"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "11px 20px", borderRadius: "11px", background: "#4F6BF5", color: "white", textDecoration: "none", fontSize: "13px", fontWeight: 700, fontFamily: "Inter, sans-serif", boxShadow: "0 2px 12px rgba(79,107,245,0.30)" }}
          >
            Request a feature →
          </a>
        </div>

      </div>
    </div>
  );
}
