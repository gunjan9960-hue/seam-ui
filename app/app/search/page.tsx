"use client";

import { useState, useEffect, Suspense } from "react";
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

// ── Answer segments (text + bold + citation) ──────────────────────────────────

const ANSWER_SEGMENTS = [
  { text: "In Q3 2023, the team decided to ",                                                                                         bold: false, cite: null  },
  { text: "descope SSO (Single Sign-On)",                                                                                             bold: true,  cite: null  },
  { text: " from the enterprise billing milestone after a cross-functional review on Sept 14.",                                       bold: false, cite: "1"   },
  { text: "\n\nThree reasons drove the decision:",                                                                                    bold: false, cite: null  },
  { text: "\n\n1. Engineering bandwidth",                                                                                             bold: true,  cite: null  },
  { text: " — the auth refactor required by SSO conflicted with the billing migration timeline. Priya (Eng Lead) estimated a 3-week slip.", bold: false, cite: "3" },
  { text: "\n\n2. Customer priority signal",                                                                                          bold: true,  cite: null  },
  { text: " — only 2 of 8 enterprise accounts flagged SSO as a blocker (Zepto and Meesho).",                                         bold: false, cite: "3"   },
  { text: "\n\n3. Dependency risk",                                                                                                   bold: true,  cite: null  },
  { text: " — SAML 2.0 integration required a third-party library review that Legal hadn't cleared.",                                bold: false, cite: "1"   },
  { text: "\n\nRahul confirmed the descoping decision in the Jira epic on Sept 18.",                                                  bold: false, cite: "2"   },
  { text: " SSO was re-queued for Q1 2024 roadmap with a dedicated 2-sprint allocation.",                                            bold: false, cite: "1"   },
];

// Pre-compute cumulative start positions for each segment
const SEG_STARTS: number[] = [];
let _pos = 0;
for (const seg of ANSWER_SEGMENTS) {
  SEG_STARTS.push(_pos);
  _pos += seg.text.length;
}
const FULL_LENGTH = _pos;

const MOCK_SOURCES: SourceCard[] = [
  { id: "1", source: "Confluence", title: "Q3 2023 Retrospective — Enterprise Billing",   excerpt: "SSO descoped due to auth refactor conflict. Re-queued for Q1 2024. Decision signed off by Priya, Arnav, and Rahul.", author: "Arnav Mehta",          date: "Sep 22, 2023", link: "#" },
  { id: "2", source: "Jira",       title: "BILL-412: SSO Integration — Enterprise Tier",  excerpt: "Status changed to Deferred by Rahul Sharma. Comment: 'Moving to Q1 — bandwidth conflict confirmed in sync.'",         author: "Rahul Sharma",         date: "Sep 18, 2023", link: "#" },
  { id: "3", source: "Slack",      title: "#product-enterprise · Sep 14, 2023",           excerpt: "Priya: 'Auth refactor will take 3 weeks minimum. We cannot ship SSO and billing migration together.' Arnav: 'Agreed.'", author: "Priya Nair, Arnav Mehta", date: "Sep 14, 2023", link: "#" },
  { id: "4", source: "Google Docs",title: "Q3 Enterprise Roadmap Review — Meeting Notes", excerpt: "Attendees: Priya, Arnav, Rahul, Meera. SSO item discussed. 2/8 customers flagged as blocker.",                        author: "Meera Singh",          date: "Sep 14, 2023", link: "#" },
];

const FOLLOW_UP_SUGGESTIONS = [
  "Which customers flagged SSO as a blocker?",
  "What is the current status of SSO in Q1 2024?",
  "Who owns the SSO spec?",
];

// ── Streaming answer renderer ─────────────────────────────────────────────────

function StreamingAnswer({ revealed, done }: { revealed: number; done: boolean }) {
  return (
    <p style={{ fontSize: "14.5px", lineHeight: "1.85", color: "#111827", whiteSpace: "pre-wrap", margin: 0 }}>
      {ANSWER_SEGMENTS.map((seg, i) => {
        const start = SEG_STARTS[i];
        const end = start + seg.text.length;
        if (revealed <= start) return null;
        const visibleText = seg.text.slice(0, revealed - start);
        const fullyRevealed = revealed >= end;
        return (
          <span key={i}>
            {seg.bold ? <strong>{visibleText}</strong> : visibleText}
            {fullyRevealed && seg.cite && (
              <sup style={{ fontSize: "9px", color: "#4F6BF5", fontWeight: 700, marginLeft: "1px", cursor: "pointer", verticalAlign: "super", lineHeight: 0 }}>
                {seg.cite}
              </sup>
            )}
          </span>
        );
      })}
      {/* Blinking cursor while streaming */}
      {!done && (
        <span style={{ display: "inline-block", width: "2px", height: "14px", background: "#4F6BF5", borderRadius: "1px", marginLeft: "2px", verticalAlign: "middle", animation: "cursorBlink 0.65s step-end infinite" }} />
      )}
    </p>
  );
}

// ── Compact source card (right panel) ────────────────────────────────────────

function SourceCardRight({ card, idx }: { card: SourceCard; idx: number }) {
  const color = SOURCE_COLORS[card.source.toLowerCase()] ?? "#9CA3AF";
  return (
    <a href={card.link}
      style={{ display: "flex", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)", textDecoration: "none", background: "#FFFFFF", boxShadow: "var(--shadow-card)", transition: "box-shadow 0.15s, border-color 0.15s" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-card-hover)"; (e.currentTarget as HTMLElement).style.borderColor = "#D1D5DB"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-card)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
    >
      <div style={{ width: "3px", background: color, flexShrink: 0 }} />
      <div style={{ flex: 1, padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px" }}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "16px", height: "16px", borderRadius: "4px", background: color, fontSize: "8px", fontWeight: 800, color: "white", flexShrink: 0 }}>
            {idx + 1}
          </span>
          <span style={{ fontSize: "10px", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {card.source}
          </span>
          <span style={{ fontSize: "10.5px", color: "var(--text-muted)", marginLeft: "auto" }}>{card.date}</span>
        </div>
        <p style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {card.title}
        </p>
        <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: 1.55, marginBottom: "6px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {card.excerpt}
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>{card.author}</span>
          <ExternalLink size={10} color="var(--text-muted)" strokeWidth={2} />
        </div>
      </div>
    </a>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";

  const [followUp, setFollowUp] = useState("");
  const [followupFocused, setFollowupFocused] = useState(false);

  // Streaming state — 5 chars per tick at 16ms ≈ ~1.8s total
  const [revealed, setRevealed] = useState(0);
  const done = revealed >= FULL_LENGTH;

  useEffect(() => {
    setRevealed(0); // reset on new query
  }, [query]);

  useEffect(() => {
    if (revealed >= FULL_LENGTH) return;
    const t = setTimeout(() => setRevealed((r) => Math.min(r + 5, FULL_LENGTH)), 16);
    return () => clearTimeout(t);
  }, [revealed]);

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
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#F8F9FB", overflow: "hidden" }}>

        {/* ── Top bar ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0 16px", height: "52px", borderBottom: "1px solid var(--border)", flexShrink: 0, background: "#FFFFFF" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, maxWidth: "640px", height: "34px", padding: "0 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px" }}>
            <Search size={13} color="var(--text-muted)" strokeWidth={2} />
            <input
              type="text"
              defaultValue={query}
              onKeyDown={(e) => { if (e.key === "Enter") router.push(`/app/search?q=${encodeURIComponent((e.target as HTMLInputElement).value)}`); }}
              style={{ flex: 1, outline: "none", background: "transparent", fontSize: "13px", color: "var(--text-primary)", fontFamily: "Inter, sans-serif", border: "none" }}
            />
          </div>
          <button onClick={handleExport}
            style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "7px", fontSize: "11.5px", fontWeight: 500, color: "var(--text-secondary)", background: "none", border: "1px solid var(--border)", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
            <Download size={11} strokeWidth={2} /> Export
          </button>
          <button onClick={() => router.push("/app")}
            style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 8px", fontSize: "11.5px", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
            <X size={12} strokeWidth={2} /> New search
          </button>
        </div>

        {/* ── Two-column body ── */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* ── LEFT: Chat thread ── */}
          <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px 24px", display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}>

            {/* ── Question bubble — right-aligned ── */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{
                maxWidth: "72%",
                padding: "13px 18px",
                borderRadius: "20px 20px 4px 20px",
                background: "#1C1E26",
                color: "#FFFFFF",
                fontSize: "15px",
                fontWeight: 500,
                lineHeight: 1.55,
                letterSpacing: "-0.1px",
                fontFamily: "Inter, sans-serif",
                boxShadow: "0 2px 12px rgba(28,30,38,0.18)",
              }}>
                {query || "Why did we descope SSO from the enterprise milestone?"}
              </div>
            </div>

            {/* ── Seam response — left-aligned ── */}
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>

              {/* Seam avatar */}
              <div style={{ width: "30px", height: "30px", borderRadius: "10px", background: "#4F6BF5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px", boxShadow: "0 2px 8px rgba(79,107,245,0.35)" }}>
                <Sparkles size={14} color="white" strokeWidth={2} />
              </div>

              {/* Response card */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Meta row */}
                <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "10px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#1C1E26", fontFamily: "Inter, sans-serif" }}>Seam</span>
                  <span style={{ padding: "2px 8px", borderRadius: "100px", fontSize: "10.5px", fontWeight: 600, color: "#4F6BF5", background: "rgba(79,107,245,0.09)", border: "1px solid rgba(79,107,245,0.18)" }}>
                    Decision Recall
                  </span>
                  {done && (
                    <span style={{ padding: "2px 8px", borderRadius: "100px", fontSize: "10px", fontWeight: 600, color: "#065F46", background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
                      {MOCK_SOURCES.length} sources
                    </span>
                  )}
                  {!done && (
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ display: "inline-block", width: "5px", height: "5px", borderRadius: "50%", background: "#4F6BF5", animation: "cursorBlink 0.9s ease infinite" }} />
                      Searching…
                    </span>
                  )}
                </div>

                {/* Streamed answer text — no card border, flows naturally */}
                <StreamingAnswer revealed={revealed} done={done} />

                {/* Follow-up chips — appear after streaming */}
                {done && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", marginTop: "18px" }}>
                    {FOLLOW_UP_SUGGESTIONS.map((s) => (
                      <button key={s} onClick={() => handleFollowUp(s)}
                        style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", borderRadius: "100px", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", background: "#FFFFFF", border: "1px solid var(--border)", cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "border-color 0.15s, color 0.15s" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#4F6BF5"; (e.currentTarget as HTMLElement).style.color = "#4F6BF5"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}>
                        <ArrowUpRight size={11} strokeWidth={2} />
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ── RIGHT: Sources ── */}
          <div style={{ width: "360px", minWidth: "320px", flexShrink: 0, borderLeft: "1px solid var(--border)", overflowY: "auto", background: "var(--surface)", display: "flex", flexDirection: "column" }}>

            {/* Header */}
            <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid var(--border)", background: "#FFFFFF", position: "sticky", top: 0, zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>Sources</span>
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "18px", height: "18px", borderRadius: "6px", background: "#4F6BF5", fontSize: "10px", fontWeight: 700, color: "white" }}>
                  {MOCK_SOURCES.length}
                </span>
              </div>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>Ranked by relevance · click to open</p>
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
        <div style={{ padding: "11px 32px 13px", borderTop: "1px solid var(--border)", background: "#FFFFFF", flexShrink: 0 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "10px", maxWidth: "720px",
            height: "42px", padding: "0 14px",
            background: "var(--surface)",
            border: `1.5px solid ${followupFocused ? "#4F6BF5" : "var(--border)"}`,
            borderRadius: "10px",
            boxShadow: followupFocused ? "0 0 0 3px rgba(79,107,245,0.10)" : "none",
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}>
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
                style={{ background: "#4F6BF5", color: "white", border: "none", borderRadius: "6px", padding: "4px 10px", fontSize: "11px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
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
