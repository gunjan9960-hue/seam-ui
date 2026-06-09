"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, X, MessageCircle, ArrowUpRight, ExternalLink, Sparkles, Download } from "lucide-react";
import AppShell from "../../components/AppShell";

const SOURCE_COLORS: Record<string, string> = {
  notion: "#555866",
  jira: "#0052CC",
  "google docs": "#34A853",
  slack: "#4A154B",
  confluence: "#1868DB",
  calendar: "#EA4335",
};

interface SourceCard {
  id: string;
  source: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  link: string;
}

const ANSWER_SEGMENTS = [
  { text: "In Q3 2023, the team decided to ",          cite: null,  bold: false },
  { text: "descope SSO (Single Sign-On)",               cite: null,  bold: true  },
  { text: " from the enterprise billing milestone after a cross-functional review on Sept 14.", cite: "1", bold: false },
  { text: "\n\nThree reasons drove the decision:",      cite: null,  bold: false },
  { text: "\n\n1. Engineering bandwidth",               cite: null,  bold: true  },
  { text: " — the auth refactor required by SSO conflicted with the billing migration timeline. Priya (Eng Lead) estimated a 3-week slip.", cite: "3", bold: false },
  { text: "\n\n2. Customer priority signal",            cite: null,  bold: true  },
  { text: " — only 2 of 8 enterprise accounts flagged SSO as a blocker (Zepto and Meesho).", cite: "3", bold: false },
  { text: "\n\n3. Dependency risk",                     cite: null,  bold: true  },
  { text: " — SAML 2.0 integration required a third-party library review that Legal hadn't cleared.", cite: "1", bold: false },
  { text: "\n\nRahul confirmed the descoping decision in the Jira epic on Sept 18.", cite: "2", bold: false },
  { text: " SSO was re-queued for Q1 2024 roadmap with a dedicated 2-sprint allocation.", cite: "1", bold: false },
];

const MOCK_SOURCES: SourceCard[] = [
  {
    id: "1",
    source: "Confluence",
    title: "Q3 2023 Retrospective — Enterprise Billing",
    excerpt: "SSO descoped due to auth refactor conflict. Re-queued for Q1 2024. Decision signed off by Priya, Arnav, and Rahul.",
    author: "Arnav Mehta",
    date: "Sep 22, 2023",
    link: "#",
  },
  {
    id: "2",
    source: "Jira",
    title: "BILL-412: SSO Integration — Enterprise Tier",
    excerpt: "Status changed to Deferred by Rahul Sharma. Comment: 'Moving to Q1 — bandwidth conflict confirmed in sync.'",
    author: "Rahul Sharma",
    date: "Sep 18, 2023",
    link: "#",
  },
  {
    id: "3",
    source: "Slack",
    title: "#product-enterprise · Sep 14, 2023",
    excerpt: "Priya: 'Auth refactor will take 3 weeks minimum. We cannot ship SSO and billing migration together.' Arnav: 'Agreed. Descoping SSO.'",
    author: "Priya Nair, Arnav Mehta",
    date: "Sep 14, 2023",
    link: "#",
  },
  {
    id: "4",
    source: "Google Docs",
    title: "Q3 Enterprise Roadmap Review — Meeting Notes",
    excerpt: "Attendees: Priya, Arnav, Rahul, Meera. SSO item discussed. 2/8 customers flagged as blocker.",
    author: "Meera Singh",
    date: "Sep 14, 2023",
    link: "#",
  },
];

const FOLLOW_UP_SUGGESTIONS = [
  "Which customers flagged SSO as a blocker?",
  "What is the current status of SSO in Q1 2024?",
  "Who owns the SSO spec?",
];

function AnswerText() {
  return (
    <p style={{ fontSize: "14px", lineHeight: "1.8", color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
      {ANSWER_SEGMENTS.map((seg, i) => (
        <span key={i}>
          {seg.bold ? <strong>{seg.text}</strong> : seg.text}
          {seg.cite && (
            <sup style={{ fontSize: "9px", color: "var(--blue)", fontWeight: 700, marginLeft: "1px", cursor: "pointer", verticalAlign: "super", lineHeight: 0 }}>
              {seg.cite}
            </sup>
          )}
        </span>
      ))}
    </p>
  );
}

// ── Right panel: compact source card ─────────────────────────────────────────

function SourceCardRight({ card, idx }: { card: SourceCard; idx: number }) {
  const color = SOURCE_COLORS[card.source.toLowerCase()] ?? "#9CA3AF";
  return (
    <a
      href={card.link}
      style={{ display: "flex", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)", textDecoration: "none", background: "#FFFFFF", transition: "box-shadow 0.15s", boxShadow: "var(--shadow-card)" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-card-hover)"; (e.currentTarget as HTMLElement).style.borderColor = "#D1D5DB"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-card)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
    >
      {/* Left accent bar */}
      <div style={{ width: "3px", background: color, flexShrink: 0 }} />

      <div style={{ flex: 1, padding: "12px 14px" }}>
        {/* Source label + citation number */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px" }}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "16px", height: "16px", borderRadius: "4px", background: color, fontSize: "8px", fontWeight: 800, color: "white", flexShrink: 0 }}>
            {idx + 1}
          </span>
          <span style={{ fontSize: "10px", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {card.source}
          </span>
          <span style={{ fontSize: "10.5px", color: "var(--text-muted)", marginLeft: "auto" }}>{card.date}</span>
        </div>

        {/* Title */}
        <p style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {card.title}
        </p>

        {/* Excerpt */}
        <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: 1.55, marginBottom: "6px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {card.excerpt}
        </p>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>{card.author}</span>
          <ExternalLink size={10} color="var(--text-muted)" strokeWidth={2} />
        </div>
      </div>
    </a>
  );
}

// ── Main search content ───────────────────────────────────────────────────────

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const [followUp, setFollowUp] = useState("");
  const [followupFocused, setFollowupFocused] = useState(false);

  const handleFollowUp = (q?: string) => {
    const fq = q ?? followUp;
    if (!fq.trim()) return;
    router.push(`/app/search?q=${encodeURIComponent(fq)}`);
    setFollowUp("");
  };

  const handleExport = () => {
    const md = `# Seam — Research Session\n**Query:** ${query}\n\n---\n\n${ANSWER_SEGMENTS.map((s) => s.text).join("")}\n\n---\n\n## Sources\n${MOCK_SOURCES.map((s, i) => `[${i + 1}] **${s.source}** — ${s.title} · ${s.date} · ${s.author}`).join("\n")}`;
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "seam-session.md"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#FFFFFF", overflow: "hidden" }}>

        {/* ── Top bar ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0 16px", height: "52px", borderBottom: "1px solid var(--border)", flexShrink: 0, background: "#FFFFFF" }}>
          {/* Search input */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, maxWidth: "640px", height: "34px", padding: "0 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px" }}>
            <Search size={13} color="var(--text-muted)" strokeWidth={2} />
            <input
              type="text"
              defaultValue={query}
              onKeyDown={(e) => { if (e.key === "Enter") router.push(`/app/search?q=${encodeURIComponent((e.target as HTMLInputElement).value)}`); }}
              style={{ flex: 1, outline: "none", background: "transparent", fontSize: "13px", color: "var(--text-primary)", fontFamily: "Inter, sans-serif", border: "none" }}
            />
          </div>

          {/* Actions */}
          <button onClick={handleExport}
            style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "7px", fontSize: "11.5px", fontWeight: 500, color: "var(--text-secondary)", background: "none", border: "1px solid var(--border)", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
            <Download size={11} strokeWidth={2} /> Export
          </button>
          <button onClick={() => router.push("/app")}
            style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 8px", borderRadius: "7px", fontSize: "11.5px", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
            <X size={12} strokeWidth={2} /> New search
          </button>
        </div>

        {/* ── Two-column body ── */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* ── LEFT: Answer ── */}
          <div style={{ flex: 1, overflowY: "auto", padding: "28px 36px 24px 32px", display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Query */}
            <h1 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.4, letterSpacing: "-0.25px", margin: 0 }}>
              {query}
            </h1>

            {/* Answer block */}
            <div style={{ borderRadius: "16px", padding: "22px 24px", background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>

              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "22px", height: "22px", borderRadius: "6px", background: "var(--blue)", flexShrink: 0 }}>
                  <Sparkles size={12} color="white" strokeWidth={2} />
                </div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--blue)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Seam Answer
                </span>
                <span style={{ padding: "3px 8px", borderRadius: "100px", fontSize: "10.5px", fontWeight: 600, color: "var(--blue)", background: "rgba(79,107,245,0.08)", border: "1px solid rgba(79,107,245,0.18)" }}>
                  Decision Recall
                </span>
                <span style={{ marginLeft: "auto", padding: "3px 8px", borderRadius: "100px", fontSize: "10px", fontWeight: 600, color: "#065F46", background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
                  {MOCK_SOURCES.length} sources
                </span>
              </div>

              <AnswerText />
            </div>

            {/* Follow-up chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {FOLLOW_UP_SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => handleFollowUp(s)}
                  style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 12px", borderRadius: "100px", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", background: "#FFFFFF", border: "1px solid var(--border)", cursor: "pointer", fontFamily: "Inter, sans-serif" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--blue)"; (e.currentTarget as HTMLElement).style.color = "var(--blue)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}>
                  <ArrowUpRight size={11} strokeWidth={2} />
                  {s}
                </button>
              ))}
            </div>

          </div>

          {/* ── RIGHT: Sources ── */}
          <div style={{ width: "360px", minWidth: "320px", flexShrink: 0, borderLeft: "1px solid var(--border)", overflowY: "auto", background: "var(--surface)", display: "flex", flexDirection: "column" }}>

            {/* Sources header */}
            <div style={{ padding: "18px 18px 12px", borderBottom: "1px solid var(--border)", background: "#FFFFFF", position: "sticky", top: 0, zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.1px" }}>Sources</span>
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "18px", height: "18px", borderRadius: "6px", background: "var(--blue)", fontSize: "10px", fontWeight: 700, color: "white" }}>
                  {MOCK_SOURCES.length}
                </span>
              </div>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>
                Ranked by relevance · click to open source
              </p>
            </div>

            {/* Cards */}
            <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
              {MOCK_SOURCES.map((card, idx) => (
                <SourceCardRight key={card.id} card={card} idx={idx} />
              ))}
            </div>

          </div>
        </div>

        {/* ── Pinned follow-up input ── */}
        <div style={{ padding: "12px 32px 14px", borderTop: "1px solid var(--border)", background: "#FFFFFF", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", maxWidth: "720px", height: "42px", padding: "0 14px", background: "var(--surface)", border: `1.5px solid ${followupFocused ? "var(--blue)" : "var(--border)"}`, borderRadius: "10px", boxShadow: followupFocused ? "0 0 0 3px rgba(79,107,245,0.10)" : "none", transition: "border-color 0.15s, box-shadow 0.15s" }}>
            <MessageCircle size={14} color="var(--text-muted)" strokeWidth={2} />
            <input
              type="text"
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              onFocus={() => setFollowupFocused(true)}
              onBlur={() => setFollowupFocused(false)}
              onKeyDown={(e) => e.key === "Enter" && handleFollowUp()}
              placeholder="Ask a follow-up..."
              style={{ flex: 1, outline: "none", background: "transparent", fontSize: "13px", color: "var(--text-primary)", fontFamily: "Inter, sans-serif", border: "none" }}
            />
            {followUp && (
              <button onClick={() => handleFollowUp()}
                style={{ background: "var(--blue)", color: "white", border: "none", borderRadius: "6px", padding: "4px 10px", fontSize: "11px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                Ask ↵
              </button>
            )}
          </div>
          <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "5px", maxWidth: "720px" }}>
            Every answer is cited — click any source card to open the original document.
          </p>
        </div>

      </div>
    </AppShell>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontSize: "13px", color: "var(--text-muted)" }}>Loading…</div>}>
      <SearchContent />
    </Suspense>
  );
}
