"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search, X, MessageCircle, ArrowUpRight, ExternalLink,
  Sparkles, Download, ThumbsUp, ThumbsDown, AlertCircle, Plug,
} from "lucide-react";
import AppShell from "../../components/AppShell";

// ── Constants ─────────────────────────────────────────────────────────────────

const SOURCE_COLORS: Record<string, string> = {
  notion: "#555866",
  jira: "#0052CC",
  "google docs": "#34A853",
  slack: "#4A154B",
  confluence: "#1868DB",
  calendar: "#EA4335",
};

interface SourceCard {
  id: string; source: string; title: string;
  excerpt: string; author: string; date: string; link: string;
}

const ANSWER_SEGMENTS = [
  { text: "In Q3 2023, the team decided to ",                                                                                              bold: false, cite: null },
  { text: "descope SSO (Single Sign-On)",                                                                                                  bold: true,  cite: null },
  { text: " from the enterprise billing milestone after a cross-functional review on Sept 14.",                                            bold: false, cite: "1"  },
  { text: "\n\nThree reasons drove the decision:",                                                                                         bold: false, cite: null },
  { text: "\n\n1. Engineering bandwidth",                                                                                                  bold: true,  cite: null },
  { text: " — the auth refactor required by SSO conflicted with the billing migration timeline. Priya (Eng Lead) estimated a 3-week slip.", bold: false, cite: "3"  },
  { text: "\n\n2. Customer priority signal",                                                                                               bold: true,  cite: null },
  { text: " — only 2 of 8 enterprise accounts flagged SSO as a blocker (Zepto and Meesho).",                                              bold: false, cite: "3"  },
  { text: "\n\n3. Dependency risk",                                                                                                        bold: true,  cite: null },
  { text: " — SAML 2.0 integration required a third-party library review that Legal hadn't cleared.",                                     bold: false, cite: "1"  },
  { text: "\n\nRahul confirmed the descoping decision in the Jira epic on Sept 18.",                                                       bold: false, cite: "2"  },
  { text: " SSO was re-queued for Q1 2024 roadmap with a dedicated 2-sprint allocation.",                                                  bold: false, cite: "1"  },
];

// Pre-compute segment start positions
const SEG_STARTS: number[] = [];
let _p = 0;
for (const seg of ANSWER_SEGMENTS) { SEG_STARTS.push(_p); _p += seg.text.length; }
const FULL_LENGTH = _p;

const MOCK_SOURCES: SourceCard[] = [
  { id: "1", source: "Confluence", title: "Q3 2023 Retrospective — Enterprise Billing",   excerpt: "SSO descoped due to auth refactor conflict. Re-queued for Q1 2024. Decision signed off by Priya, Arnav, and Rahul.", author: "Arnav Mehta",             date: "Sep 22, 2023", link: "#" },
  { id: "2", source: "Jira",       title: "BILL-412: SSO Integration — Enterprise Tier",  excerpt: "Status changed to Deferred by Rahul Sharma. Comment: 'Moving to Q1 — bandwidth conflict confirmed in sync.'",         author: "Rahul Sharma",            date: "Sep 18, 2023", link: "#" },
  { id: "3", source: "Slack",      title: "#product-enterprise · Sep 14, 2023",           excerpt: "Priya: 'Auth refactor will take 3 weeks minimum. We cannot ship SSO and billing migration together.' Arnav: 'Agreed.'", author: "Priya Nair, Arnav Mehta", date: "Sep 14, 2023", link: "#" },
  { id: "4", source: "Google Docs",title: "Q3 Enterprise Roadmap Review — Meeting Notes", excerpt: "Attendees: Priya, Arnav, Rahul, Meera. SSO item discussed. 2/8 customers flagged as blocker.",                        author: "Meera Singh",             date: "Sep 14, 2023", link: "#" },
];

const FOLLOW_UPS = [
  "Which customers flagged SSO as a blocker?",
  "What is the current status of SSO in Q1 2024?",
  "Who owns the SSO spec?",
];

// Keywords that Seam "knows about" in this demo
const KNOWN_KEYWORDS = ["sso", "descope", "enterprise", "billing", "q3", "q1", "saml", "sprint", "auth"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function useTimestamp() {
  const [ts, setTs] = useState("");
  useEffect(() => {
    setTs(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
  }, []);
  return ts;
}

// ── Feedback buttons ──────────────────────────────────────────────────────────

function FeedbackButtons() {
  const [selected, setSelected] = useState<"up" | "down" | null>(null);
  const [thanked, setThanked] = useState(false);

  const pick = (v: "up" | "down") => {
    if (selected) return;
    setSelected(v);
    setTimeout(() => setThanked(true), 600);
  };

  if (thanked) {
    return (
      <span style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic", fontFamily: "Inter, sans-serif" }}>
        Thanks — that helps us improve
      </span>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <span style={{ fontSize: "11px", color: "var(--text-muted)", marginRight: "4px", fontFamily: "Inter, sans-serif" }}>
        Was this helpful?
      </span>
      <button
        onClick={() => pick("up")}
        title="Good answer"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: "28px", height: "28px", borderRadius: "8px", border: "1px solid",
          borderColor: selected === "up" ? "#10B981" : "var(--border)",
          background: selected === "up" ? "#ECFDF5" : "#FFFFFF",
          color: selected === "up" ? "#10B981" : "var(--text-muted)",
          cursor: selected ? "default" : "pointer",
          transition: "all 0.18s",
        }}
        onMouseEnter={(e) => { if (!selected) { (e.currentTarget as HTMLElement).style.borderColor = "#10B981"; (e.currentTarget as HTMLElement).style.color = "#10B981"; } }}
        onMouseLeave={(e) => { if (!selected) { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; } }}
      >
        <ThumbsUp size={13} strokeWidth={2} />
      </button>
      <button
        onClick={() => pick("down")}
        title="Bad answer"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: "28px", height: "28px", borderRadius: "8px", border: "1px solid",
          borderColor: selected === "down" ? "#EF4444" : "var(--border)",
          background: selected === "down" ? "#FEF2F2" : "#FFFFFF",
          color: selected === "down" ? "#EF4444" : "var(--text-muted)",
          cursor: selected ? "default" : "pointer",
          transition: "all 0.18s",
        }}
        onMouseEnter={(e) => { if (!selected) { (e.currentTarget as HTMLElement).style.borderColor = "#EF4444"; (e.currentTarget as HTMLElement).style.color = "#EF4444"; } }}
        onMouseLeave={(e) => { if (!selected) { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; } }}
      >
        <ThumbsDown size={13} strokeWidth={2} />
      </button>
    </div>
  );
}

// ── Streaming answer ──────────────────────────────────────────────────────────

function StreamingAnswer({ revealed, done }: { revealed: number; done: boolean }) {
  return (
    <p style={{ fontSize: "14.5px", lineHeight: "1.85", color: "#111827", whiteSpace: "pre-wrap", margin: 0 }}>
      {ANSWER_SEGMENTS.map((seg, i) => {
        const start = SEG_STARTS[i];
        const end = start + seg.text.length;
        if (revealed <= start) return null;
        const visible = seg.text.slice(0, revealed - start);
        const full = revealed >= end;
        return (
          <span key={i}>
            {seg.bold ? <strong>{visible}</strong> : visible}
            {full && seg.cite && (
              <sup style={{ fontSize: "9px", color: "#4F6BF5", fontWeight: 700, marginLeft: "1px", cursor: "pointer", verticalAlign: "super", lineHeight: 0 }}>
                {seg.cite}
              </sup>
            )}
          </span>
        );
      })}
      {!done && (
        <span style={{ display: "inline-block", width: "2px", height: "14px", background: "#4F6BF5", borderRadius: "1px", marginLeft: "2px", verticalAlign: "middle", animation: "cursorBlink 0.65s step-end infinite" }} />
      )}
    </p>
  );
}

// ── Can't answer block ────────────────────────────────────────────────────────

function CantAnswerBlock({ query }: { query: string }) {
  const router = useRouter();
  return (
    <div style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid #FDE68A" }}>
      {/* Top band */}
      <div style={{ background: "#FFFBEB", padding: "14px 18px 12px", borderBottom: "1px solid #FDE68A", display: "flex", alignItems: "center", gap: "8px" }}>
        <AlertCircle size={15} color="#D97706" strokeWidth={2} />
        <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#92400E", fontFamily: "Inter, sans-serif" }}>
          No answer found in your sources
        </span>
      </div>

      {/* Body */}
      <div style={{ background: "#FFFFFF", padding: "16px 18px 18px" }}>
        <p style={{ fontSize: "13.5px", color: "#374151", lineHeight: 1.7, marginBottom: "16px", fontFamily: "Inter, sans-serif" }}>
          Seam searched across <strong>Notion, Jira, Google Docs, Slack,</strong> and <strong>Confluence</strong> but couldn't find a reliable answer for:
        </p>

        {/* Query echo */}
        <div style={{ padding: "10px 14px", borderRadius: "10px", background: "#F9FAFB", border: "1px solid var(--border)", marginBottom: "16px" }}>
          <span style={{ fontSize: "13px", color: "#6B7280", fontStyle: "italic", fontFamily: "Inter, sans-serif" }}>
            "{query}"
          </span>
        </div>

        {/* Reasons */}
        <p style={{ fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "Inter, sans-serif" }}>
          Possible reasons
        </p>
        <ul style={{ margin: "0 0 18px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" }}>
          {[
            "This topic may not be documented in your connected sources",
            "The relevant tool (e.g. Confluence or Slack) may not be connected",
            "Try rephrasing — e.g. use the project or ticket name",
          ].map((r) => (
            <li key={r} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#D97706", marginTop: "6px", flexShrink: 0 }} />
              <span style={{ fontSize: "12.5px", color: "#6B7280", lineHeight: 1.55, fontFamily: "Inter, sans-serif" }}>{r}</span>
            </li>
          ))}
        </ul>

        {/* CTAs */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => router.push("/app/integrations")}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "9px", fontSize: "12.5px", fontWeight: 600, background: "#1C1E26", color: "white", border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
            <Plug size={12} strokeWidth={2} />
            Connect more sources
          </button>
          <button
            onClick={() => router.push("/app")}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "9px", fontSize: "12.5px", fontWeight: 600, background: "none", color: "#374151", border: "1px solid var(--border)", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
            <Search size={12} strokeWidth={2} />
            Try a new search
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Right panel source card ───────────────────────────────────────────────────

function SourceCardRight({ card, idx }: { card: SourceCard; idx: number }) {
  const color = SOURCE_COLORS[card.source.toLowerCase()] ?? "#9CA3AF";
  return (
    <a href={card.link}
      style={{ display: "flex", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)", textDecoration: "none", background: "#FFFFFF", boxShadow: "var(--shadow-card)", transition: "box-shadow 0.15s, border-color 0.15s" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-card-hover)"; (e.currentTarget as HTMLElement).style.borderColor = "#D1D5DB"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-card)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}>
      <div style={{ width: "3px", background: color, flexShrink: 0 }} />
      <div style={{ flex: 1, padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px" }}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "16px", height: "16px", borderRadius: "4px", background: color, fontSize: "8px", fontWeight: 800, color: "white", flexShrink: 0 }}>{idx + 1}</span>
          <span style={{ fontSize: "10px", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{card.source}</span>
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
  const ts = useTimestamp();

  const canAnswer = KNOWN_KEYWORDS.some((kw) => query.toLowerCase().includes(kw));

  const [followUp, setFollowUp] = useState("");
  const [followupFocused, setFollowupFocused] = useState(false);
  const [revealed, setRevealed] = useState(0);
  const done = revealed >= FULL_LENGTH;

  useEffect(() => { setRevealed(0); }, [query]);

  useEffect(() => {
    if (!canAnswer || revealed >= FULL_LENGTH) return;
    const t = setTimeout(() => setRevealed((r) => Math.min(r + 5, FULL_LENGTH)), 16);
    return () => clearTimeout(t);
  }, [revealed, canAnswer]);

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
          <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px 24px", display: "flex", flexDirection: "column", gap: "20px", minWidth: 0 }}>

            {/* Question bubble — right */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
              <div style={{
                maxWidth: "72%", padding: "12px 18px",
                borderRadius: "20px 20px 4px 20px",
                background: "#1C1E26", color: "#FFFFFF",
                fontSize: "15px", fontWeight: 500, lineHeight: 1.55,
                letterSpacing: "-0.1px", fontFamily: "Inter, sans-serif",
                boxShadow: "0 2px 12px rgba(28,30,38,0.18)",
              }}>
                {query || "Why did we descope SSO from the enterprise milestone?"}
              </div>
              {/* Timestamp */}
              {ts && (
                <span style={{ fontSize: "10.5px", color: "var(--text-muted)", fontFamily: "Inter, sans-serif", paddingRight: "4px" }}>
                  {ts}
                </span>
              )}
            </div>

            {/* Seam response — left */}
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>

              {/* Avatar */}
              <div style={{ width: "30px", height: "30px", borderRadius: "10px", background: "#4F6BF5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px", boxShadow: "0 2px 8px rgba(79,107,245,0.35)" }}>
                <Sparkles size={14} color="white" strokeWidth={2} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>

                {/* Meta row */}
                <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "10px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#1C1E26", fontFamily: "Inter, sans-serif" }}>Seam</span>
                  {ts && <span style={{ fontSize: "10.5px", color: "var(--text-muted)", fontFamily: "Inter, sans-serif" }}>{ts}</span>}
                  {canAnswer && (
                    <span style={{ padding: "2px 8px", borderRadius: "100px", fontSize: "10.5px", fontWeight: 600, color: "#4F6BF5", background: "rgba(79,107,245,0.09)", border: "1px solid rgba(79,107,245,0.18)" }}>
                      Decision Recall
                    </span>
                  )}
                  {canAnswer && done && (
                    <span style={{ padding: "2px 8px", borderRadius: "100px", fontSize: "10px", fontWeight: 600, color: "#065F46", background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
                      {MOCK_SOURCES.length} sources
                    </span>
                  )}
                  {canAnswer && !done && (
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px", fontFamily: "Inter, sans-serif" }}>
                      <span style={{ display: "inline-block", width: "5px", height: "5px", borderRadius: "50%", background: "#4F6BF5", animation: "cursorBlink 0.9s ease infinite" }} />
                      Searching…
                    </span>
                  )}
                </div>

                {/* Answer or can't-answer */}
                {canAnswer
                  ? <StreamingAnswer revealed={revealed} done={done} />
                  : <CantAnswerBlock query={query} />
                }

                {/* Post-stream: feedback + follow-ups */}
                {canAnswer && done && (
                  <>
                    {/* Feedback row */}
                    <div style={{ display: "flex", alignItems: "center", marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--border)" }}>
                      <FeedbackButtons />
                    </div>

                    {/* Follow-up chips */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", marginTop: "12px" }}>
                      {FOLLOW_UPS.map((s) => (
                        <button key={s} onClick={() => handleFollowUp(s)}
                          style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", borderRadius: "100px", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", background: "#FFFFFF", border: "1px solid var(--border)", cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "border-color 0.15s, color 0.15s" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#4F6BF5"; (e.currentTarget as HTMLElement).style.color = "#4F6BF5"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}>
                          <ArrowUpRight size={11} strokeWidth={2} />
                          {s}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Feedback for can't-answer too */}
                {!canAnswer && (
                  <div style={{ marginTop: "16px" }}>
                    <FeedbackButtons />
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* ── RIGHT: Sources ── */}
          <div style={{ width: "360px", minWidth: "320px", flexShrink: 0, borderLeft: "1px solid var(--border)", overflowY: "auto", background: "var(--surface)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid var(--border)", background: "#FFFFFF", position: "sticky", top: 0, zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>Sources</span>
                {canAnswer && (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "18px", height: "18px", borderRadius: "6px", background: "#4F6BF5", fontSize: "10px", fontWeight: 700, color: "white" }}>
                    {MOCK_SOURCES.length}
                  </span>
                )}
              </div>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                {canAnswer ? "Ranked by relevance · click to open" : "No matching sources found"}
              </p>
            </div>

            <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
              {canAnswer
                ? MOCK_SOURCES.map((card, idx) => <SourceCardRight key={card.id} card={card} idx={idx} />)
                : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: "10px", padding: "32px 20px", textAlign: "center" }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "14px", background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Search size={20} color="#D97706" strokeWidth={1.5} />
                    </div>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", fontFamily: "Inter, sans-serif" }}>No sources found</p>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6, fontFamily: "Inter, sans-serif" }}>
                      Connect more tools so Seam has more to search across.
                    </p>
                    <button
                      onClick={() => router.push("/app/integrations")}
                      style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "9px", fontSize: "12px", fontWeight: 600, background: "#1C1E26", color: "white", border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                      <Plug size={12} strokeWidth={2} /> Connect sources
                    </button>
                  </div>
                )
              }
            </div>
          </div>
        </div>

        {/* ── Pinned follow-up ── */}
        <div style={{ padding: "11px 32px 13px", borderTop: "1px solid var(--border)", background: "#FFFFFF", flexShrink: 0 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "10px", maxWidth: "720px",
            height: "42px", padding: "0 14px", background: "var(--surface)",
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
