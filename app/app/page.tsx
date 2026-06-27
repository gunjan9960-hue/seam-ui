"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowUpRight, Plug, RefreshCw, Lock, Zap } from "lucide-react";
import AppShell from "../components/AppShell";
import { createClient } from "@/lib/supabase/client";

// ── Rotating suggestion pool ──────────────────────────────────────────────────
// 16 queries across different PM intent types. 4 shown at a time, rotated by
// day of week so returning users see fresh prompts each day.
const QUERY_POOL = [
  "Why did we descope video reviews from the H2 roadmap?",
  "What was decided on the moderation pipeline — rule-based or ML?",
  "Which enterprise clients are at risk of churning and why?",
  "What are the open action items from the Q3 planning session?",
  "What commitments did we make to enterprise clients this quarter?",
  "Who owns the mobile roadmap and what's the current status?",
  "What's the rationale behind deprioritising offline mode?",
  "What did we promise the enterprise pilot team by end of Q3?",
  "Why did we choose build over buy for the notification system?",
  "What's the latest acceptance criteria for the search feature?",
  "Which features were cut from the last release and why?",
  "Who signed off on the new pricing structure?",
  "What's blocking the API v2 launch?",
  "What does the onboarding flow look like for new enterprise customers?",
  "What were the findings from the last user research round?",
  "What's been deferred the longest on the backlog and why?",
];

function getDayQueries(): string[] {
  const offset = (new Date().getDay() * 3) % QUERY_POOL.length;
  return Array.from({ length: 4 }, (_, i) => QUERY_POOL[(offset + i) % QUERY_POOL.length]);
}

// ── Query type chips ──────────────────────────────────────────────────────────
const QUERY_CHIPS = [
  { label: "Decision Recall",        starter: "Why did we decide to " },
  { label: "Spec Lookup",            starter: "What are the specs for " },
  { label: "Stakeholder Commitment", starter: "What did we commit to " },
  { label: "Onboarding",             starter: "Walk me through " },
];

const PREVIEW_QUERIES = [
  "Why did we decide to build vs buy the moderation pipeline?",
  "What commitments did we make to Enterprise clients in Q2?",
  "What's the rationale behind deprioritising mobile this quarter?",
];

// ── Greeting ──────────────────────────────────────────────────────────────────
function getGreeting(name: string): string {
  const h = new Date().getHours();
  const salutation = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  let first: string;
  if (name.includes("@")) {
    // Email fallback: strip domain, digits, and separators, then capitalise
    const local = name.split("@")[0].replace(/[0-9._-]/g, " ").trim().split(/\s+/)[0] ?? "";
    first = local.charAt(0).toUpperCase() + local.slice(1);
  } else {
    first = name.split(" ")[0];
  }
  return first ? `${salutation}, ${first}.` : `${salutation}.`;
}

// ── Brand icons ───────────────────────────────────────────────────────────────
function BrandIcon({ id, size = 32 }: { id: string; size?: number }) {
  const icons: Record<string, React.ReactElement> = {
    notion: (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="10" fill="#191919"/>
        <rect x="12" y="10" width="24" height="29" rx="3" fill="white"/>
        <line x1="16" y1="19" x2="32" y2="19" stroke="#191919" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="16" y1="25" x2="28" y2="25" stroke="#191919" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="16" y1="31" x2="24" y2="31" stroke="#191919" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
    slack: (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="10" fill="#4A154B"/>
        <circle cx="17" cy="18" r="4" fill="#E01E5A"/>
        <circle cx="31" cy="18" r="4" fill="#36C5F0"/>
        <circle cx="17" cy="30" r="4" fill="#2EB67D"/>
        <circle cx="31" cy="30" r="4" fill="#ECB22E"/>
      </svg>
    ),
  };
  return icons[id] ?? null;
}

// ── Source pill ───────────────────────────────────────────────────────────────
function SourcePill({ id }: { id: string }) {
  const label = id.charAt(0).toUpperCase() + id.slice(1);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "7px",
        padding: "5px 11px 5px 7px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: "20px",
      }}
    >
      <div style={{ width: "20px", height: "20px", borderRadius: "5px", overflow: "hidden", flexShrink: 0 }}>
        <BrandIcon id={id} size={20} />
      </div>
      <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.65)", fontFamily: "Inter, sans-serif" }}>
        {label}
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10.5px", color: "rgba(255,255,255,0.25)", fontFamily: "Inter, sans-serif" }}>
        ·
        <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#34D399", display: "inline-block", flexShrink: 0 }} />
        live
      </span>
    </div>
  );
}

// ── Supported providers ───────────────────────────────────────────────────────
const SUPPORTED_PROVIDERS = ["notion", "slack"];

// ── States ────────────────────────────────────────────────────────────────────
type ReadyState = "loading" | "no-sources" | "syncing" | "ready";

interface SourceMeta {
  provider: string;
  status: string;
  last_synced_at: string | null;
}

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [readyState, setReadyState] = useState<ReadyState>("loading");
  const [sources, setSources] = useState<SourceMeta[]>([]);
  const [userName, setUserName] = useState<string>("");
  const [lastSearch, setLastSearch] = useState<{ query: string; ts: string } | null>(null);

  const suggestedQueries = useMemo(() => getDayQueries(), []);

  useEffect(() => {
    // Still read lastSearch to power the "updated since your last visit" comparison
    const threads = JSON.parse(localStorage.getItem("seam_threads") ?? "[]");
    if (threads.length > 0) setLastSearch(threads[0]);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const [{ data: { user } }, { data: sourcesData }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("sources").select("provider,status,last_synced_at"),
      ]);

      if (user) {
        setUserName(user.user_metadata?.full_name ?? user.email ?? "");
      }

      const active = (sourcesData ?? []).filter(
        (s: SourceMeta) =>
          SUPPORTED_PROVIDERS.includes(s.provider) &&
          (s.status === "connected" || s.status === "syncing")
      ) as SourceMeta[];

      if (active.length === 0) {
        setReadyState("no-sources");
        return;
      }

      setSources(active);

      const { count } = await supabase
        .from("chunks")
        .select("id", { count: "exact", head: true });

      setReadyState(count && count > 0 ? "ready" : "syncing");
    }
    load();
  }, []);

  const handleSearch = (q?: string) => {
    const searchQuery = q ?? query;
    if (!searchQuery.trim() || readyState !== "ready") return;
    router.push(`/app/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const greeting = getGreeting(userName);

  // Sources that synced after the user's last search
  const updatedSources = useMemo(() => {
    if (!lastSearch) return [];
    return sources.filter(
      (s) => s.last_synced_at && new Date(s.last_synced_at) > new Date(lastSearch.ts)
    );
  }, [sources, lastSearch]);

  return (
    <AppShell>
      <div
        className="flex flex-col items-center justify-center h-full"
        style={{ background: "#0F1117" }}
      >
        {/* Greeting */}
        {userName && (
          <p
            style={{
              fontSize: "13px",
              color: "rgba(255,255,255,0.35)",
              fontWeight: 500,
              fontFamily: "Inter, sans-serif",
              marginBottom: "18px",
              letterSpacing: "0.01em",
            }}
          >
            {greeting}
          </p>
        )}

        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-baseline gap-1 mb-2">
            <span style={{ fontWeight: 900, fontSize: "36px", color: "white", letterSpacing: "-2px", lineHeight: 1, fontFamily: "Inter, sans-serif" }}>
              seam
            </span>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4F6BF5", display: "inline-block", marginBottom: "5px", flexShrink: 0 }} />
          </div>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.14em", fontWeight: 600, textTransform: "uppercase" }}>
            Pull any thread.
          </p>
        </div>

        {/* ── No sources: locked state ── */}
        {(readyState === "no-sources" || readyState === "loading") && (
          <div className="w-full flex flex-col items-center" style={{ maxWidth: "480px", padding: "0 24px" }}>
            <div
              style={{
                width: "100%",
                padding: "32px 28px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "18px",
                textAlign: "center",
              }}
            >
              <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "rgba(79,107,245,0.10)", border: "1px solid rgba(79,107,245,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Plug size={20} color="#4F6BF5" strokeWidth={1.8} />
              </div>
              <h2 style={{ fontSize: "17px", fontWeight: 700, color: "rgba(255,255,255,0.9)", letterSpacing: "-0.4px", margin: "0 0 8px", fontFamily: "Inter, sans-serif" }}>
                Connect a source to unlock search
              </h2>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.38)", lineHeight: 1.65, margin: "0 0 24px" }}>
                Seam searches your real Notion pages and Slack threads — but needs at least one source connected first.
              </p>
              <button
                onClick={() => router.push("/app/integrations")}
                style={{ padding: "11px 24px", borderRadius: "11px", background: "#4F6BF5", color: "white", border: "none", cursor: "pointer", fontSize: "13.5px", fontWeight: 600, fontFamily: "Inter, sans-serif", boxShadow: "0 4px 16px rgba(79,107,245,0.35)" }}
              >
                Go to Integrations →
              </button>
            </div>

            {/* Preview: what you'll be able to ask */}
            <div style={{ marginTop: "20px", width: "100%", textAlign: "left" }}>
              <p style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                What you&apos;ll be able to ask
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {PREVIEW_QUERIES.map((q) => (
                  <div
                    key={q}
                    style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "9px" }}
                  >
                    <ArrowUpRight size={11} color="rgba(79,107,245,0.4)" strokeWidth={2} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.28)", fontFamily: "Inter, sans-serif", lineHeight: 1.4 }}>{q}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Sources syncing ── */}
        {readyState === "syncing" && (
          <div className="w-full flex flex-col items-center" style={{ maxWidth: "480px", padding: "0 24px" }}>
            <div
              style={{
                width: "100%",
                padding: "32px 28px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "18px",
                textAlign: "center",
              }}
            >
              <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "rgba(79,107,245,0.10)", border: "1px solid rgba(79,107,245,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <RefreshCw size={20} color="#4F6BF5" strokeWidth={1.8} style={{ animation: "spin 1.5s linear infinite" }} />
              </div>
              <h2 style={{ fontSize: "17px", fontWeight: 700, color: "rgba(255,255,255,0.9)", letterSpacing: "-0.4px", margin: "0 0 8px", fontFamily: "Inter, sans-serif" }}>
                Indexing your sources…
              </h2>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.38)", lineHeight: 1.65, margin: "0 0 20px" }}>
                Your connected sources are being indexed. Search will be ready in a few minutes once content is available.
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                {sources.map((s) => (
                  <div key={s.provider} style={{ width: "32px", height: "32px", borderRadius: "8px", overflow: "hidden", opacity: 0.7 }}>
                    <BrandIcon id={s.provider} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Ready: full search UI ── */}
        {readyState === "ready" && (
          <>
            <div className="w-full flex flex-col" style={{ maxWidth: "600px", padding: "0 24px" }}>

              {/* Search box */}
              <div
                className="flex items-center gap-3 px-4"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: `1.5px solid ${focused ? "#4F6BF5" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: "14px",
                  height: "54px",
                  boxShadow: focused ? "0 0 0 3px rgba(79,107,245,0.18)" : "none",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
              >
                <Search size={15} color="rgba(255,255,255,0.3)" strokeWidth={2} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  maxLength={500}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Ask anything about your product..."
                  className="flex-1 outline-none bg-transparent"
                  style={{ fontSize: "14px", color: "rgba(255,255,255,0.88)", fontFamily: "Inter, sans-serif", fontWeight: 400 }}
                  autoFocus
                />
                {query.length >= 400 && (
                  <span style={{ fontSize: "11px", color: query.length >= 480 ? "#F87171" : "rgba(255,255,255,0.25)", fontFamily: "Inter, sans-serif", flexShrink: 0 }}>
                    {query.length} / 500
                  </span>
                )}
                {query && (
                  <button
                    onClick={() => handleSearch()}
                    style={{ background: "#4F6BF5", color: "white", fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif", padding: "6px 14px", borderRadius: "9px", display: "flex", alignItems: "center", gap: "5px" }}
                  >
                    Search
                    <kbd style={{ fontSize: "10px", opacity: 0.7, fontFamily: "inherit" }}>↵</kbd>
                  </button>
                )}
              </div>

              {/* Query type chips */}
              <div style={{ marginTop: "14px", display: "flex", gap: "7px", flexWrap: "wrap" }}>
                {QUERY_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => {
                      setQuery(chip.starter);
                      setTimeout(() => {
                        const el = inputRef.current;
                        if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
                      }, 0);
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      fontSize: "11.5px",
                      fontWeight: 500,
                      color: "rgba(255,255,255,0.4)",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "20px",
                      padding: "5px 12px",
                      cursor: "pointer",
                      fontFamily: "Inter, sans-serif",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.color = "rgba(255,255,255,0.8)";
                      el.style.background = "rgba(79,107,245,0.1)";
                      el.style.borderColor = "rgba(79,107,245,0.3)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.color = "rgba(255,255,255,0.4)";
                      el.style.background = "rgba(255,255,255,0.04)";
                      el.style.borderColor = "rgba(255,255,255,0.08)";
                    }}
                  >
                    <Zap size={10} strokeWidth={2} />
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Source pills + privacy line */}
              <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>

                {/* New since last session */}
                {updatedSources.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#34D399", flexShrink: 0, display: "inline-block" }} />
                    <span style={{ fontSize: "11px", color: "rgba(52,211,153,0.75)", fontFamily: "Inter, sans-serif" }}>
                      {updatedSources.map((s) => s.provider.charAt(0).toUpperCase() + s.provider.slice(1)).join(" and ")} updated since your last visit
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", fontWeight: 500, flexShrink: 0 }}>
                    Searching across
                  </span>
                  <div style={{ display: "flex", gap: "7px", flexWrap: "wrap" }}>
                    {sources.map((s) => (
                      <SourcePill key={s.provider} id={s.provider} />
                    ))}
                  </div>
                </div>

                {/* Privacy line */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.2)",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  <Lock size={9} strokeWidth={2} style={{ color: "rgba(255,255,255,0.22)", flexShrink: 0 }} />
                  Read-only · Every answer links to its source · Your data stays in your organisation
                </div>
              </div>
            </div>

            {/* Suggested queries */}
            <div className="mt-8 w-full" style={{ maxWidth: "600px", padding: "0 24px" }}>
              <p className="mb-3" style={{ fontSize: "10.5px", fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Suggested
              </p>
              <div className="flex flex-col gap-1.5">
                {suggestedQueries.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSearch(q)}
                    className="flex items-center gap-3 text-left px-4 py-3 rounded-lg transition-all"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", fontSize: "13px", color: "rgba(255,255,255,0.55)", cursor: "pointer", fontFamily: "Inter, sans-serif", borderRadius: "10px" }}
                    onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,255,255,0.07)"; el.style.borderColor = "rgba(79,107,245,0.25)"; el.style.color = "rgba(255,255,255,0.85)"; }}
                    onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,255,255,0.04)"; el.style.borderColor = "rgba(255,255,255,0.07)"; el.style.color = "rgba(255,255,255,0.55)"; }}
                  >
                    <ArrowUpRight size={13} color="#4F6BF5" strokeWidth={2} style={{ flexShrink: 0 }} />
                    <span style={{ lineHeight: 1.4 }}>{q}</span>
                  </button>
                ))}
              </div>

            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
