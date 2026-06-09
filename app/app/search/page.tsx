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

// Answer segments — text interleaved with citation superscripts
const ANSWER_SEGMENTS = [
  {
    text: "In Q3 2023, the team decided to ",
    cite: null,
  },
  {
    text: "descope SSO (Single Sign-On)",
    bold: true,
    cite: null,
  },
  {
    text: " from the enterprise billing milestone after a cross-functional review on Sept 14.",
    cite: "1",
  },
  {
    text: "\n\nThree reasons drove the decision:",
    cite: null,
  },
  {
    text: "\n\n1. Engineering bandwidth",
    bold: true,
    cite: null,
  },
  {
    text: " — the auth refactor required by SSO conflicted with the billing migration timeline. Priya (Eng Lead) estimated a 3-week slip.",
    cite: "3",
  },
  {
    text: "\n\n2. Customer priority signal",
    bold: true,
    cite: null,
  },
  {
    text: " — only 2 of 8 enterprise accounts flagged SSO as a blocker (Zepto and Meesho).",
    cite: "3",
  },
  {
    text: "\n\n3. Dependency risk",
    bold: true,
    cite: null,
  },
  {
    text: " — SAML 2.0 integration required a third-party library review that Legal hadn't cleared.",
    cite: "1",
  },
  {
    text: "\n\nRahul confirmed the descoping decision in the Jira epic on Sept 18.",
    cite: "2",
  },
  {
    text: " SSO was re-queued for Q1 2024 roadmap with a dedicated 2-sprint allocation.",
    cite: "1",
  },
];

const MOCK_SOURCES: SourceCard[] = [
  {
    id: "1",
    source: "Confluence",
    title: "Q3 2023 Retrospective — Enterprise Billing",
    excerpt:
      "SSO descoped due to auth refactor conflict. Re-queued for Q1 2024. Decision signed off by Priya, Arnav, and Rahul.",
    author: "Arnav Mehta",
    date: "Sep 22, 2023",
    link: "#",
  },
  {
    id: "2",
    source: "Jira",
    title: "BILL-412: SSO Integration — Enterprise Tier",
    excerpt:
      "Status changed to Deferred by Rahul Sharma. Comment: 'Moving to Q1 — bandwidth conflict confirmed in sync.'",
    author: "Rahul Sharma",
    date: "Sep 18, 2023",
    link: "#",
  },
  {
    id: "3",
    source: "Slack",
    title: "#product-enterprise · Sep 14, 2023",
    excerpt:
      "Priya: 'Auth refactor will take 3 weeks minimum. We cannot ship SSO and billing migration together.' Arnav: 'Agreed. Descoping SSO. Rahul to update Jira.'",
    author: "Priya Nair, Arnav Mehta",
    date: "Sep 14, 2023",
    link: "#",
  },
  {
    id: "4",
    source: "Google Docs",
    title: "Q3 Enterprise Roadmap Review — Meeting Notes",
    excerpt:
      "Attendees: Priya, Arnav, Rahul, Meera (Design). SSO item discussed. 2/8 customers flagged as blocker.",
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
    <p style={{ fontSize: "13.5px", lineHeight: "1.75", color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
      {ANSWER_SEGMENTS.map((seg, i) => (
        <span key={i}>
          {seg.bold ? <strong>{seg.text}</strong> : seg.text}
          {seg.cite && (
            <sup
              style={{
                fontSize: "9px",
                color: "var(--blue)",
                fontWeight: 700,
                marginLeft: "1px",
                cursor: "pointer",
                verticalAlign: "super",
                lineHeight: 0,
              }}
            >
              {seg.cite}
            </sup>
          )}
        </span>
      ))}
    </p>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const [followUp, setFollowUp] = useState("");
  const [activeTab, setActiveTab] = useState<"answer" | "sources">("answer");
  const [followupFocused, setFollowupFocused] = useState(false);

  const handleFollowUp = (q?: string) => {
    const fq = q ?? followUp;
    if (!fq.trim()) return;
    router.push(`/app/search?q=${encodeURIComponent(fq)}`);
    setFollowUp("");
  };

  return (
    <AppShell>
      <div className="flex flex-col h-full" style={{ background: "#FFFFFF" }}>

        {/* Top bar */}
        <div
          className="flex items-center gap-3 px-4"
          style={{
            height: "52px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <div
            className="flex items-center gap-2 px-3 flex-1"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              height: "34px",
              maxWidth: "560px",
            }}
          >
            <Search size={13} color="var(--text-muted)" strokeWidth={2} />
            <input
              type="text"
              defaultValue={query}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  router.push(`/app/search?q=${encodeURIComponent((e.target as HTMLInputElement).value)}`);
                }
              }}
              className="flex-1 outline-none bg-transparent"
              style={{ fontSize: "13px", color: "var(--text-primary)", fontFamily: "Inter, sans-serif" }}
            />
          </div>
          {/* Download session */}
          <button
            title="Download session as Markdown"
            className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
            style={{
              fontSize: "11.5px",
              color: "var(--text-muted)",
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: "7px",
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
              padding: "5px 10px",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
            onClick={() => {
              const md = `# Seam — Research Session\n**Query:** ${query}\n\n---\n\n${ANSWER_SEGMENTS.map(s => s.text).join("")}\n\n---\n\n## Sources\n${MOCK_SOURCES.map((s, i) => `[${i+1}] **${s.source}** — ${s.title} · ${s.date} · ${s.author}`).join("\n")}`;
              const blob = new Blob([md], { type: "text/markdown" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = "seam-session.md"; a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download size={11} strokeWidth={2} />
            Export
          </button>

          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
            style={{
              fontSize: "11.5px",
              color: "var(--text-muted)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
              padding: "4px 8px",
            }}
          >
            <X size={12} strokeWidth={2} />
            New search
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 pt-5 pb-4" style={{ maxWidth: "720px" }}>

            {/* Query */}
            <h1
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "var(--text-primary)",
                lineHeight: 1.45,
                marginBottom: "20px",
                letterSpacing: "-0.15px",
              }}
            >
              {query}
            </h1>

            {/* Tabs */}
            <div
              className="flex gap-0 mb-5"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              {(["answer", "sources"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "8px 14px",
                    fontSize: "12.5px",
                    fontWeight: 500,
                    color: activeTab === tab ? "var(--blue)" : "var(--text-muted)",
                    borderBottom: activeTab === tab ? "2px solid var(--blue)" : "2px solid transparent",
                    marginBottom: "-1px",
                    background: "transparent",
                    border: "none",
                    borderBottomWidth: "2px",
                    borderBottomStyle: "solid",
                    borderBottomColor: activeTab === tab ? "var(--blue)" : "transparent",
                    cursor: "pointer",
                    fontFamily: "Inter, sans-serif",
                    letterSpacing: "0.01em",
                  }}
                >
                  {tab === "answer" ? "Answer" : `Sources  ${MOCK_SOURCES.length}`}
                </button>
              ))}
            </div>

            {activeTab === "answer" && (
              <div>
                {/* AI answer block */}
                <div
                  className="rounded-xl p-5 mb-5"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-card)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="flex items-center justify-center rounded-md"
                      style={{ width: "22px", height: "22px", background: "var(--blue)" }}
                    >
                      <Sparkles size={12} color="white" strokeWidth={2} />
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "var(--blue)",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                      }}
                    >
                      Seam Answer
                    </span>
                    {/* Query intent badge */}
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{
                        fontSize: "10px",
                        background: "rgba(79,107,245,0.08)",
                        color: "var(--blue)",
                        fontWeight: 600,
                        border: "1px solid rgba(79,107,245,0.18)",
                        letterSpacing: "0.02em",
                      }}
                    >
                      Decision Recall
                    </span>
                    <span
                      className="ml-auto px-2 py-0.5 rounded-full"
                      style={{
                        fontSize: "10px",
                        background: "#ECFDF5",
                        color: "#065F46",
                        fontWeight: 600,
                        border: "1px solid #A7F3D0",
                      }}
                    >
                      {MOCK_SOURCES.length} sources
                    </span>
                  </div>
                  <AnswerText />
                </div>

                {/* Source cards */}
                <p
                  className="mb-3"
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.09em",
                  }}
                >
                  Sources
                </p>
                <div className="flex flex-col gap-2 mb-5">
                  {MOCK_SOURCES.map((card, idx) => {
                    const color = SOURCE_COLORS[card.source.toLowerCase()] || "#9CA3AF";
                    return (
                      <a
                        key={card.id}
                        href={card.link}
                        className="flex rounded-xl overflow-hidden transition-all"
                        style={{
                          border: "1px solid var(--border)",
                          boxShadow: "var(--shadow-card)",
                          textDecoration: "none",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-card-hover)";
                          (e.currentTarget as HTMLElement).style.borderColor = "#D1D5DB";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-card)";
                          (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                        }}
                      >
                        <div style={{ width: "3px", background: color, flexShrink: 0, borderRadius: "0 0 0 0" }} />
                        <div className="flex-1 px-4 py-3">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span
                              className="flex items-center justify-center rounded"
                              style={{
                                width: "16px",
                                height: "16px",
                                background: color,
                                fontSize: "8px",
                                fontWeight: 800,
                                color: "white",
                                letterSpacing: "0.02em",
                                flexShrink: 0,
                              }}
                            >
                              {idx + 1}
                            </span>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 600,
                                color,
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                              }}
                            >
                              {card.source}
                            </span>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "auto" }}>
                              {card.date}
                            </span>
                          </div>
                          <p
                            style={{
                              fontSize: "13px",
                              fontWeight: 600,
                              color: "var(--text-primary)",
                              marginBottom: "4px",
                              lineHeight: 1.35,
                            }}
                          >
                            {card.title}
                          </p>
                          <p
                            style={{
                              fontSize: "12px",
                              color: "var(--text-secondary)",
                              lineHeight: 1.55,
                              marginBottom: "6px",
                            }}
                          >
                            {card.excerpt}
                          </p>
                          <div className="flex items-center gap-1">
                            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>by {card.author}</span>
                            <ExternalLink
                              size={10}
                              color="var(--text-muted)"
                              strokeWidth={2}
                              style={{ marginLeft: "auto" }}
                            />
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>

                {/* Follow-up chips */}
                <div className="flex flex-wrap gap-2">
                  {FOLLOW_UP_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleFollowUp(s)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all"
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        color: "var(--text-secondary)",
                        fontFamily: "Inter, sans-serif",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--blue)";
                        (e.currentTarget as HTMLElement).style.color = "var(--blue)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                        (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                      }}
                    >
                      <ArrowUpRight size={11} strokeWidth={2} />
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "sources" && (
              <div className="flex flex-col gap-3">
                {MOCK_SOURCES.map((card, idx) => {
                  const color = SOURCE_COLORS[card.source.toLowerCase()] || "#9CA3AF";
                  return (
                    <a
                      key={card.id}
                      href={card.link}
                      className="flex rounded-xl overflow-hidden transition-all"
                      style={{
                        border: "1px solid var(--border)",
                        boxShadow: "var(--shadow-card)",
                        textDecoration: "none",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-card-hover)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-card)";
                      }}
                    >
                      <div style={{ width: "4px", background: color, flexShrink: 0 }} />
                      <div className="flex-1 px-4 py-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              color,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            {idx + 1}. {card.source}
                          </span>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "auto" }}>
                            {card.date} · {card.author}
                          </span>
                        </div>
                        <p
                          style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px", lineHeight: 1.35 }}
                        >
                          {card.title}
                        </p>
                        <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                          {card.excerpt}
                        </p>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}

          </div>
        </div>

        {/* Follow-up input — pinned */}
        <div
          className="px-5 py-3 flex-shrink-0"
          style={{ borderTop: "1px solid var(--border)", background: "#FFFFFF" }}
        >
          <div
            className="flex items-center gap-3 px-4"
            style={{
              background: "var(--surface)",
              border: `1.5px solid ${followupFocused ? "var(--blue)" : "var(--border)"}`,
              borderRadius: "10px",
              height: "42px",
              maxWidth: "680px",
              boxShadow: followupFocused ? "0 0 0 3px rgba(79,107,245,0.10)" : "none",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
          >
            <MessageCircle size={14} color="var(--text-muted)" strokeWidth={2} />
            <input
              type="text"
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              onFocus={() => setFollowupFocused(true)}
              onBlur={() => setFollowupFocused(false)}
              onKeyDown={(e) => e.key === "Enter" && handleFollowUp()}
              placeholder="Ask a follow-up..."
              className="flex-1 outline-none bg-transparent"
              style={{ fontSize: "13px", color: "var(--text-primary)", fontFamily: "Inter, sans-serif" }}
            />
            {followUp && (
              <button
                onClick={() => handleFollowUp()}
                style={{
                  background: "var(--blue)",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Ask ↵
              </button>
            )}
          </div>
          <p
            style={{
              fontSize: "10px",
              color: "var(--text-muted)",
              marginTop: "6px",
              maxWidth: "680px",
              letterSpacing: "0.01em",
            }}
          >
            Every answer is cited. Click any source card to open the original document.
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
