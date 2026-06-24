"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowUpRight, Plug, RefreshCw } from "lucide-react";
import AppShell from "../components/AppShell";
import { createClient } from "@/lib/supabase/client";

// ── Suggested queries — tied to BazaarVoice synthetic data ───────────────────
const SUGGESTED_QUERIES = [
  "Why did we descope video reviews from the H2 roadmap?",
  "What was decided on the moderation pipeline — rule-based or ML?",
  "Which enterprise clients are at risk of churning and why?",
  "What are the open action items from the Q3 planning session?",
];

// ── Brand icons ───────────────────────────────────────────────────────────────
function BrandIcon({ id }: { id: string }) {
  const s = 32;
  const icons: Record<string, React.ReactElement> = {
    notion: (
      <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="10" fill="#191919"/>
        <rect x="12" y="10" width="24" height="29" rx="3" fill="white"/>
        <line x1="16" y1="19" x2="32" y2="19" stroke="#191919" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="16" y1="25" x2="28" y2="25" stroke="#191919" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="16" y1="31" x2="24" y2="31" stroke="#191919" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
    jira: (
      <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="10" fill="#0052CC"/>
        <path d="M24 10L14 20l5.5 5.5L24 21l4.5 4.5L34 20 24 10z" fill="#DEEBFF"/>
        <path d="M24 38L34 28l-5.5-5.5L24 27l-4.5-4.5L14 28 24 38z" fill="#DEEBFF"/>
      </svg>
    ),
    slack: (
      <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
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

// ── States ────────────────────────────────────────────────────────────────────
type ReadyState = "loading" | "no-sources" | "syncing" | "ready";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const router = useRouter();

  const [readyState, setReadyState] = useState<ReadyState>("loading");
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);

  useEffect(() => {
    const supabase = createClient();
    async function check() {
      const { data: sources } = await supabase
        .from("sources")
        .select("provider,status");

      const active = (sources ?? []).filter(
        (s) => s.status === "connected" || s.status === "syncing"
      );

      if (active.length === 0) {
        setReadyState("no-sources");
        return;
      }

      setConnectedProviders(active.map((s) => s.provider));

      // Check if any chunks exist
      const { count } = await supabase
        .from("chunks")
        .select("id", { count: "exact", head: true });

      setReadyState(count && count > 0 ? "ready" : "syncing");
    }
    check();
  }, []);

  const handleSearch = (q?: string) => {
    const searchQuery = q ?? query;
    if (!searchQuery.trim() || readyState !== "ready") return;
    router.push(`/app/search?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <AppShell>
      <div
        className="flex flex-col items-center justify-center h-full"
        style={{ background: "#0F1117" }}
      >
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
                Seam searches your real Notion pages, Jira issues, and Slack threads — but needs at least one source connected first.
              </p>
              <button
                onClick={() => router.push("/app/integrations")}
                style={{ padding: "11px 24px", borderRadius: "11px", background: "#4F6BF5", color: "white", border: "none", cursor: "pointer", fontSize: "13.5px", fontWeight: 600, fontFamily: "Inter, sans-serif", boxShadow: "0 4px 16px rgba(79,107,245,0.35)" }}
              >
                Go to Integrations →
              </button>
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
                {connectedProviders.map((p) => (
                  <div key={p} style={{ width: "32px", height: "32px", borderRadius: "8px", overflow: "hidden", opacity: 0.7 }}>
                    <BrandIcon id={p} />
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
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Ask anything about your product..."
                  className="flex-1 outline-none bg-transparent"
                  style={{ fontSize: "14px", color: "rgba(255,255,255,0.88)", fontFamily: "Inter, sans-serif", fontWeight: 400 }}
                  autoFocus
                />
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

              {/* Connected app icons — only real connected sources */}
              <div className="flex items-center gap-3 mt-4">
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", fontWeight: 500, flexShrink: 0 }}>
                  Searching across
                </span>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {connectedProviders.map((id) => (
                    <div
                      key={id}
                      title={id.charAt(0).toUpperCase() + id.slice(1)}
                      style={{ width: "32px", height: "32px", borderRadius: "8px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.4)", opacity: 0.85, transition: "opacity 0.15s, transform 0.15s", cursor: "default" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; (e.currentTarget as HTMLElement).style.transform = "scale(1.08)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.85"; (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                    >
                      <BrandIcon id={id} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Suggested queries */}
            <div className="mt-8 w-full" style={{ maxWidth: "600px", padding: "0 24px" }}>
              <p className="mb-3" style={{ fontSize: "10.5px", fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Suggested
              </p>
              <div className="flex flex-col gap-1.5">
                {SUGGESTED_QUERIES.map((q) => (
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
