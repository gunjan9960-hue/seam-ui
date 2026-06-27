"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  Search, ExternalLink, Sparkles,
  ThumbsUp, ThumbsDown, AlertCircle,
  Clock, Scale, FileText, User, FlaskConical, Map, Handshake, Compass, Plus,
  Copy, Check, RefreshCw,
} from "lucide-react";
import AppShell from "@/app/components/AppShell";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────
interface SourceCard {
  id: string;
  source: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  url: string;
}

interface Exchange {
  id: string;
  question: string;
  answer: string;
  intent: string;
  sources: SourceCard[];
  isStale?: boolean;
  suggestions?: string[];
  isDemo?: boolean;
}

// ── localStorage thread utils ─────────────────────────────────────────────────
interface ThreadEntry { id: string; query: string; ts: string; }

function saveThread(query: string) {
  if (typeof window === "undefined") return;
  const prev: ThreadEntry[] = JSON.parse(localStorage.getItem("seam_threads") ?? "[]");
  const deduped = prev.filter((t) => t.query !== query);
  const next: ThreadEntry[] = [{ id: Date.now().toString(), query, ts: new Date().toISOString() }, ...deduped].slice(0, 10);
  localStorage.setItem("seam_threads", JSON.stringify(next));
}

// ── Sync recency helpers ──────────────────────────────────────────────────────
function relativeTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const SOURCE_TO_PROVIDER: Record<string, string> = {
  "Notion": "notion",
  "Slack": "slack",
};

// ── Source colours ────────────────────────────────────────────────────────────
const SOURCE_COLORS: Record<string, string> = {
  Notion: "#888888",
  Slack:  "#E01E5A",
};

const SOURCE_ICONS: Record<string, string> = {
  Notion: "N",
  Slack:  "#",
};

// ── Intent config ─────────────────────────────────────────────────────────────
const INTENT_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  decision_recall:        { label: "Decision",    icon: Scale,        color: "#A78BFA" },
  spec_lookup:            { label: "Spec Lookup", icon: FileText,     color: "#60A5FA" },
  customer_request:       { label: "Customer",    icon: User,         color: "#FB923C" },
  research_history:       { label: "Research",    icon: FlaskConical, color: "#34D399" },
  roadmap_rationale:      { label: "Roadmap",     icon: Map,          color: "#4ADE80" },
  stakeholder_commitment: { label: "Commitment",  icon: Handshake,    color: "#FCD34D" },
  onboarding:             { label: "Onboarding",  icon: Compass,      color: "#818CF8" },
};

// ── Skeleton loader ───────────────────────────────────────────────────────────
function Skeleton() {
  const shimmer = {
    background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.6s infinite",
    borderRadius: "5px",
  };
  return (
    <div style={{ paddingTop: "4px" }}>
      {/* fake question */}
      <div style={{ ...shimmer, height: "26px", width: "70%", marginBottom: "20px" }} />
      <div style={{ ...shimmer, height: "1px", marginBottom: "20px" }} />
      {/* fake answer lines */}
      {[90, 100, 85, 100, 60].map((w, i) => (
        <div key={i} style={{ ...shimmer, height: "14px", width: `${w}%`, marginBottom: "10px" }} />
      ))}
    </div>
  );
}

// ── Answer markdown renderer ──────────────────────────────────────────────────
function AnswerText({ text }: { text: string }) {
  return (
    <div
      style={{
        fontSize: "15px",
        color: "rgba(255,255,255,0.85)",
        lineHeight: 1.85,
      }}
    >
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <p style={{ margin: "0 0 14px" }}>{children}</p>
          ),
          strong: ({ children }) => (
            <strong style={{ color: "rgba(255,255,255,0.95)", fontWeight: 600 }}>{children}</strong>
          ),
          em: ({ children }) => (
            <em style={{ color: "rgba(255,255,255,0.7)" }}>{children}</em>
          ),
          ul: ({ children }) => (
            <ul style={{ paddingLeft: "18px", margin: "0 0 14px", listStyleType: "disc" }}>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol style={{ paddingLeft: "18px", margin: "0 0 14px" }}>{children}</ol>
          ),
          li: ({ children }) => (
            <li style={{ marginBottom: "5px", color: "rgba(255,255,255,0.82)" }}>{children}</li>
          ),
          h1: ({ children }) => (
            <h1 style={{ fontSize: "17px", fontWeight: 700, color: "rgba(255,255,255,0.95)", margin: "0 0 10px", letterSpacing: "-0.3px" }}>{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "rgba(255,255,255,0.92)", margin: "18px 0 8px", letterSpacing: "-0.2px" }}>{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.88)", margin: "14px 0 6px" }}>{children}</h3>
          ),
          code: ({ children }) => (
            <code style={{ fontSize: "12.5px", fontFamily: "monospace", color: "#818CF8", background: "rgba(129,140,248,0.1)", borderRadius: "4px", padding: "1px 5px" }}>
              {children}
            </code>
          ),
          blockquote: ({ children }) => (
            <blockquote style={{ borderLeft: "2px solid rgba(255,255,255,0.15)", paddingLeft: "14px", margin: "0 0 14px", color: "rgba(255,255,255,0.55)" }}>
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "#60A5FA", textDecoration: "underline", textUnderlineOffset: "2px" }}>
              {children}
            </a>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

// ── Source card ───────────────────────────────────────────────────────────────
function SourceGridCard({ s, index, syncedAt }: { s: SourceCard; index: number; syncedAt?: string }) {
  const color = SOURCE_COLORS[s.source] ?? "#4F6BF5";
  const icon = SOURCE_ICONS[s.source] ?? "·";
  return (
    <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
          padding: "11px 13px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "10px",
          cursor: "pointer",
          transition: "background 0.15s, border-color 0.15s",
          height: "100%",
          boxSizing: "border-box",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.055)";
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.11)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
        }}
      >
        <div
          style={{
            width: "26px",
            height: "26px",
            borderRadius: "6px",
            background: `${color}18`,
            border: `1px solid ${color}28`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "10px",
            fontWeight: 800,
            color,
            flexShrink: 0,
            fontFamily: "Inter, sans-serif",
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "3px" }}>
            <span style={{ fontSize: "9px", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              {s.source}
            </span>
            <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.18)", marginLeft: "auto" }}>
              {index + 1}
            </span>
            <ExternalLink size={8} style={{ color: "rgba(255,255,255,0.18)", flexShrink: 0 }} />
          </div>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 500,
              color: "rgba(255,255,255,0.75)",
              lineHeight: 1.4,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical" as const,
            }}
          >
            {s.title}
          </div>
          <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", marginTop: "4px" }}>
            {s.author} · {s.date}
          </div>
          {syncedAt && (
            <div style={{ display: "flex", alignItems: "center", gap: "3px", marginTop: "3px" }}>
              <RefreshCw size={7} style={{ color: "rgba(255,255,255,0.18)" }} />
              <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.18)" }}>synced {relativeTime(syncedAt)}</span>
            </div>
          )}
        </div>
      </div>
    </a>
  );
}

// ── Copy with citations ───────────────────────────────────────────────────────
function CopyButton({ answer, sources }: { answer: string; sources: SourceCard[] }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    const parts = [answer];
    if (sources.length > 0) {
      parts.push("\n\nSources:");
      sources.forEach((s, i) => {
        parts.push(`${i + 1}. ${s.title} — ${s.source}${s.url ? ` — ${s.url}` : ""}`);
      });
    }
    navigator.clipboard.writeText(parts.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={copy}
      style={{ background: "none", border: "none", cursor: "pointer", color: copied ? "#34D399" : "rgba(255,255,255,0.22)", padding: 0, display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", transition: "color 0.15s" }}
      onMouseEnter={(e) => { if (!copied) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"; }}
      onMouseLeave={(e) => { if (!copied) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.22)"; }}
    >
      {copied ? <><Check size={13} /><span>Copied</span></> : <Copy size={13} />}
    </button>
  );
}

// ── Inline feedback ───────────────────────────────────────────────────────────
function InlineFeedback() {
  const [val, setVal] = useState<null | "up" | "down">(null);
  if (val)
    return <span style={{ fontSize: "11px", color: "#34D399" }}>✓ Thanks</span>;
  return (
    <span style={{ display: "inline-flex", gap: "8px" }}>
      <button
        onClick={() => setVal("up")}
        style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.22)", padding: 0, display: "flex", transition: "color 0.15s" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.22)")}
      >
        <ThumbsUp size={13} />
      </button>
      <button
        onClick={() => setVal("down")}
        style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.22)", padding: 0, display: "flex", transition: "color 0.15s" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.22)")}
      >
        <ThumbsDown size={13} />
      </button>
    </span>
  );
}

// ── One completed exchange ────────────────────────────────────────────────────
function CompletedExchange({ exchange, syncMap }: { exchange: Exchange; syncMap: Record<string, string> }) {
  const intentCfg = INTENT_CONFIG[exchange.intent];
  const Icon = intentCfg?.icon ?? Search;

  return (
    <div style={{ marginBottom: "52px", animation: "fadeSlideIn 0.3s ease" }}>

      {/* Question */}
      <h2
        style={{
          fontSize: "21px",
          fontWeight: 700,
          color: "rgba(255,255,255,0.96)",
          letterSpacing: "-0.5px",
          lineHeight: 1.3,
          margin: "0 0 14px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {exchange.question}
      </h2>

      {/* Meta: intent · sources · stale */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px", flexWrap: "wrap" }}>
        {intentCfg && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "11px",
              fontWeight: 600,
              color: intentCfg.color,
              background: `${intentCfg.color}14`,
              border: `1px solid ${intentCfg.color}28`,
              borderRadius: "20px",
              padding: "3px 9px",
            }}
          >
            <Icon size={10} strokeWidth={2.2} />
            {intentCfg.label}
          </span>
        )}
        {exchange.sources.length > 0 && (
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.28)", display: "flex", alignItems: "center", gap: "4px" }}>
            <Sparkles size={9} style={{ color: "#4F6BF5" }} />
            {exchange.sources.length} source{exchange.sources.length !== 1 ? "s" : ""}
          </span>
        )}
        {exchange.isStale && (
          <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#FCD34D" }}>
            <Clock size={9} />
            Sources may be outdated
          </span>
        )}
      </div>

      {/* Hairline divider */}
      <div style={{ height: "1px", background: "rgba(255,255,255,0.055)", marginBottom: "22px" }} />

      {/* No-match warning */}
      {exchange.sources.length === 0 && !exchange.isDemo && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: "9px", background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.18)", borderRadius: "10px", padding: "10px 14px", marginBottom: "16px" }}>
          <AlertCircle size={13} style={{ color: "#FCD34D", flexShrink: 0, marginTop: "1px" }} />
          <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", lineHeight: 1.55 }}>
            No matching documents found in your indexed sources. This answer is based on general knowledge — verify before sharing with a stakeholder.
          </span>
        </div>
      )}

      {/* Answer — clean, no box */}
      <AnswerText text={exchange.answer} />

      {/* Ambiguity suggestions */}
      {exchange.suggestions && exchange.suggestions.length > 0 && (
        <div style={{ marginTop: "4px", marginBottom: "20px" }}>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", marginBottom: "7px" }}>Did you mean:</div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {exchange.suggestions.map((s) => (
              <span
                key={s}
                style={{
                  fontSize: "11.5px",
                  color: "#818CF8",
                  background: "rgba(129,140,248,0.08)",
                  border: "1px solid rgba(129,140,248,0.17)",
                  borderRadius: "20px",
                  padding: "3px 11px",
                  cursor: "pointer",
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sources grid */}
      {exchange.sources.length > 0 && (
        <div style={{ marginTop: "20px", marginBottom: "16px" }}>
          <div
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: "rgba(255,255,255,0.2)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "10px",
            }}
          >
            Sources
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
              gap: "7px",
            }}
          >
            {exchange.sources.map((s, i) => (
              <SourceGridCard key={s.id} s={s} index={i} syncedAt={syncMap[SOURCE_TO_PROVIDER[s.source] ?? ""]} />
            ))}
          </div>
        </div>
      )}

      {/* Feedback + copy */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "16px" }}>
        <InlineFeedback />
        <div style={{ width: "1px", height: "12px", background: "rgba(255,255,255,0.08)" }} />
        <CopyButton answer={exchange.answer} sources={exchange.sources} />
      </div>
    </div>
  );
}

// ── Follow-up suggestions ─────────────────────────────────────────────────────
const FOLLOW_UPS: Record<string, string[]> = {
  decision_recall:        ["Who made this decision?", "What's the rationale?", "Any customer impact?"],
  spec_lookup:            ["What's the current status?", "Who owns this spec?", "Any open blockers?"],
  customer_request:       ["Which customers asked for this?", "What's the priority?", "Is this on the roadmap?"],
  research_history:       ["What were the key findings?", "Who ran this research?", "What was decided?"],
  roadmap_rationale:      ["What's the timeline?", "What are the dependencies?", "Why this priority?"],
  stakeholder_commitment: ["Who committed to this?", "What's the deadline?", "Any risks?"],
  onboarding:             ["What are the steps?", "Who is responsible?", "What tools are involved?"],
};
const DEFAULT_FOLLOW_UPS = ["Tell me more", "Who is the owner?", "What's the timeline?"];

// ── Main search component ─────────────────────────────────────────────────────
function SearchContent() {
  const params = useSearchParams();
  const router = useRouter();
  const query = params.get("q") ?? "";

  const chatRef = useRef<HTMLDivElement>(null);
  const followUpRef = useRef<HTMLInputElement>(null);
  const hasRun = useRef(false);
  const [inputFocused, setInputFocused] = useState(false);

  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [activeQuery, setActiveQuery] = useState<string>("");
  const [streaming, setStreaming] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [followUp, setFollowUp] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [syncMap, setSyncMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (query && !hasRun.current) {
      hasRun.current = true;
      saveThread(query);
      runQuery(query, []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("sources").select("provider,last_synced_at").then(({ data }) => {
      if (!data) return;
      const map: Record<string, string> = {};
      for (const s of data) {
        if (s.last_synced_at) map[s.provider as string] = s.last_synced_at as string;
      }
      setSyncMap(map);
    });
  }, []);

  async function runQuery(q: string, history: { question: string; answer: string }[]) {
    setActiveQuery(q);
    setIsLoading(true);
    setStreaming("");
    setApiError(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, history }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error((err as { error: string }).error ?? `HTTP ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const sepIdx = buffer.indexOf("\n\n__SOURCES__");
        if (sepIdx !== -1) {
          const answerText = buffer.slice(0, sepIdx);
          const metaJson = buffer.slice(sepIdx + 13);
          setStreaming(answerText);

          try {
            const meta = JSON.parse(metaJson) as { intent: string; sources: SourceCard[]; isStale?: boolean; suggestions?: string[]; isDemo?: boolean };
            const newExchange: Exchange = {
              id: Date.now().toString(),
              question: q,
              answer: answerText,
              intent: meta.intent,
              sources: meta.sources,
              isStale: meta.isStale,
              suggestions: meta.suggestions ?? [],
              isDemo: meta.isDemo,
            };
            setExchanges((prev) => [...prev, newExchange]);
            setStreaming("");
            setIsLoading(false);
          } catch {
            setIsLoading(false);
          }
          break;
        } else {
          setStreaming(buffer);
          requestAnimationFrame(() => {
            chatRef.current?.scrollTo({ top: chatRef.current!.scrollHeight, behavior: "smooth" });
          });
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setApiError(msg);
      setIsLoading(false);
    }
  }

  const handleFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUp.trim() || isLoading) return;
    const q = followUp.trim();
    setFollowUp("");
    saveThread(q);
    const history = exchanges.map((ex) => ({ question: ex.question, answer: ex.answer }));
    runQuery(q, history);
    setTimeout(() => chatRef.current?.scrollTo({ top: chatRef.current!.scrollHeight, behavior: "smooth" }), 80);
  };

  const isStreamingNow = isLoading || streaming.length > 0;
  const lastIntent = exchanges[exchanges.length - 1]?.intent;

  return (
    <AppShell>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: "#0F1117" }}>

        {/* ── Top bar ── */}
        <div
          style={{
            height: "52px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "#0F1117",
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
            gap: "8px",
            flexShrink: 0,
          }}
        >
          {/* Logo — clickable to home */}
          <button
            onClick={() => router.push("/app")}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "baseline", gap: "2px" }}
          >
            <span style={{ fontWeight: 900, fontSize: "16px", color: "white", letterSpacing: "-1px", fontFamily: "Inter, sans-serif" }}>seam</span>
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#4F6BF5", display: "inline-block" }} />
          </button>

          <div style={{ width: "1px", height: "13px", background: "rgba(255,255,255,0.08)", margin: "0 4px" }} />
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", fontWeight: 500 }}>AI search layer for PMs</span>

          <div style={{ flex: 1 }} />

          {/* New search */}
          <button
            onClick={() => router.push("/app")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "11.5px",
              fontWeight: 600,
              color: "rgba(255,255,255,0.45)",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: "8px",
              padding: "5px 11px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.75)";
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.09)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)";
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
            }}
          >
            <Plus size={11} />
            New search
          </button>
        </div>

        {/* ── Scrollable content ── */}
        <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "44px 24px 0" }}>
          <div style={{ maxWidth: "720px", margin: "0 auto" }}>

            {/* API error */}
            {apiError && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  background: "rgba(185,28,28,0.1)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: "12px",
                  padding: "14px 16px",
                  marginBottom: "28px",
                  fontSize: "13px",
                  color: "#FCA5A5",
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: "1px" }} />
                <div>
                  <strong>Search error:</strong> {apiError}
                  {apiError.includes("ANTHROPIC_API_KEY") && (
                    <div style={{ marginTop: "4px", fontSize: "12px", color: "rgba(252,165,165,0.6)" }}>
                      Add ANTHROPIC_API_KEY in Vercel → Project → Settings → Environment Variables.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Completed exchanges */}
            {exchanges.map((ex) => (
              <CompletedExchange key={ex.id} exchange={ex} syncMap={syncMap} />
            ))}

            {/* In-progress: question heading + skeleton/streaming */}
            {isStreamingNow && activeQuery && (
              <div style={{ marginBottom: "28px" }}>
                {/* Question visible immediately */}
                <h2
                  style={{
                    fontSize: "21px",
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.96)",
                    letterSpacing: "-0.5px",
                    lineHeight: 1.3,
                    margin: "0 0 14px",
                    fontFamily: "Inter, sans-serif",
                    animation: "fadeSlideIn 0.25s ease",
                  }}
                >
                  {activeQuery}
                </h2>

                <div style={{ height: "1px", background: "rgba(255,255,255,0.055)", marginBottom: "22px" }} />

                {/* Skeleton while retrieving */}
                {isLoading && streaming.length === 0 && <Skeleton />}

                {/* Streaming answer */}
                {streaming.length > 0 && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px" }}>
                      <Sparkles size={11} style={{ color: "#4F6BF5" }} />
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "#818CF8", letterSpacing: "0.03em" }}>
                        Generating
                      </span>
                      <span
                        style={{
                          display: "inline-block",
                          width: "2px",
                          height: "13px",
                          background: "#4F6BF5",
                          verticalAlign: "text-bottom",
                          animation: "cursorBlink 0.9s infinite",
                          marginLeft: "2px",
                          borderRadius: "1px",
                        }}
                      />
                    </div>
                    <AnswerText text={streaming} />
                  </div>
                )}
              </div>
            )}

            {/* Follow-up bar */}
            {!isStreamingNow && (exchanges.length > 0 || apiError) && (
              <form
                onSubmit={handleFollowUp}
                style={{
                  position: "sticky",
                  bottom: 0,
                  paddingTop: "20px",
                  paddingBottom: "24px",
                  background: "linear-gradient(to bottom, transparent, #0F1117 30%)",
                }}
              >
                {/* Suggestion chips */}
                <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexWrap: "wrap" }}>
                  {(FOLLOW_UPS[lastIntent] ?? DEFAULT_FOLLOW_UPS).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => { setFollowUp(s); setTimeout(() => followUpRef.current?.focus(), 0); }}
                      style={{
                        fontSize: "11.5px",
                        color: "rgba(255,255,255,0.42)",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.09)",
                        borderRadius: "20px",
                        padding: "4px 12px",
                        cursor: "pointer",
                        transition: "all 0.15s",
                        fontFamily: "Inter, sans-serif",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.75)";
                        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.14)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.42)";
                        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.09)";
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Input with focus glow */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    background: "rgba(255,255,255,0.05)",
                    border: `1px solid ${inputFocused ? "rgba(79,107,245,0.5)" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: "14px",
                    padding: "12px 16px",
                    transition: "border-color 0.2s",
                    boxShadow: inputFocused ? "0 0 0 3px rgba(79,107,245,0.1)" : "none",
                  }}
                  onClick={() => followUpRef.current?.focus()}
                >
                  <Search size={14} style={{ color: inputFocused ? "rgba(79,107,245,0.7)" : "rgba(255,255,255,0.22)", flexShrink: 0, transition: "color 0.2s" }} />
                  <input
                    ref={followUpRef}
                    value={followUp}
                    onChange={(e) => setFollowUp(e.target.value)}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    placeholder="Ask a follow-up…"
                    disabled={isLoading}
                    style={{
                      flex: 1,
                      fontSize: "14px",
                      color: "rgba(255,255,255,0.88)",
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      fontFamily: "Inter, sans-serif",
                    }}
                  />
                  {followUp.trim() && (
                    <button
                      type="submit"
                      style={{
                        padding: "6px 14px",
                        borderRadius: "9px",
                        background: "#4F6BF5",
                        color: "white",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: 600,
                        letterSpacing: "0.01em",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      Ask
                    </button>
                  )}
                </div>
              </form>
            )}

            <div style={{ height: "32px" }} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
