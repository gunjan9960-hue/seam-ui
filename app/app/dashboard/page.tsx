"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  CheckSquare,
  FileText,
  ExternalLink,
  Clock,
  Search,
  ArrowUpRight,
  Plug,
  RefreshCw,
} from "lucide-react";
import AppShell from "../../components/AppShell";
import { createClient } from "@/lib/supabase/client";

// ── Thread history ────────────────────────────────────────────────────────────

interface ThreadEntry { id: string; query: string; ts: string; }

function loadThreads(): ThreadEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("seam_threads");
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function relativeTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Data types ────────────────────────────────────────────────────────────────

interface Source { provider: string; status: string; }

interface Doc {
  id: string;
  title: string;
  url: string | null;
  provider: string;
  doc_type: string | null;
  author: string | null;
  last_modified: string | null;
  indexed_at: string;
}

// ── Shared UI components ──────────────────────────────────────────────────────

function SectionCard({
  icon: Icon,
  title,
  count,
  action,
  onAction,
  children,
  fullWidth,
}: {
  icon: React.ElementType;
  title: string;
  count?: number;
  action?: string;
  onAction?: () => void;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "#FFFFFF",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-card)",
        gridColumn: fullWidth ? "1 / -1" : undefined,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} color="var(--text-secondary)" strokeWidth={2} />
        <span style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.1px" }}>
          {title}
        </span>
        {count !== undefined && (
          <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "10px", fontWeight: 700, background: "var(--surface)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
            {count}
          </span>
        )}
        {action && onAction && (
          <button
            onClick={onAction}
            className="ml-auto flex items-center gap-1 transition-opacity hover:opacity-70"
            style={{ fontSize: "11px", color: "var(--blue)", background: "none", border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif", fontWeight: 500 }}
          >
            {action}
            <ExternalLink size={10} strokeWidth={2} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function AskSeamBtn({ query }: { query: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(`/app?q=${encodeURIComponent(query)}`)}
      style={{ fontSize: "11px", color: "var(--text-secondary)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "6px", padding: "4px 10px", cursor: "pointer", fontFamily: "Inter, sans-serif", fontWeight: 500 }}
    >
      Ask Seam
    </button>
  );
}

function ConnectPrompt({ provider, label }: { provider: string; label: string }) {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center py-8 gap-3 text-center">
      <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)" }}>
        <Plug size={16} color="var(--text-muted)" strokeWidth={1.5} />
      </div>
      <div>
        <p style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
          {label} not connected
        </p>
        <p style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.5 }}>
          Connect {label} in Integrations to see your {provider === "jira" ? "issues" : "messages"} here.
        </p>
      </div>
      <button
        onClick={() => router.push("/app/integrations")}
        style={{ fontSize: "11.5px", fontWeight: 600, color: "#4F6BF5", background: "rgba(79,107,245,0.08)", border: "1.5px solid rgba(79,107,245,0.20)", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}
      >
        Connect {label} →
      </button>
    </div>
  );
}

function LoadingRows({ n = 3 }: { n?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="px-3 py-2.5 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)", height: "56px", animation: "pulse 1.5s ease-in-out infinite" }} />
      ))}
    </div>
  );
}

const PROVIDER_LABEL: Record<string, string> = { notion: "Notion", jira: "Jira", slack: "Slack" };
const PROVIDER_COLOR: Record<string, string> = { notion: "#555866", jira: "#0052CC", slack: "#4A154B" };

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const [threads] = useState<ThreadEntry[]>(() => loadThreads().slice(0, 5));
  const [userName, setUserName] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const full: string = user.user_metadata?.full_name ?? user.email ?? "";
        setUserName(full.split(" ")[0] || "there");
      }
      const [{ data: sourcesData }, { data: docsData }] = await Promise.all([
        supabase.from("sources").select("provider,status"),
        supabase.from("documents")
          .select("id,title,url,provider,doc_type,author,last_modified,indexed_at")
          .order("indexed_at", { ascending: false })
          .limit(30),
      ]);
      setSources(sourcesData ?? []);
      setDocs(docsData ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const isActive = (provider: string) =>
    sources.some((s) => s.provider === provider && (s.status === "connected" || s.status === "syncing"));

  const jiraConnected = isActive("jira");
  const slackConnected = isActive("slack");

  const jiraDocs = docs.filter((d) => d.provider === "jira");
  const slackDocs = docs.filter((d) => d.provider === "slack");
  const recentDocs = docs.slice(0, 6);

  const connectedCount = sources.filter((s) => s.status === "connected" || s.status === "syncing").length;
  const totalDocs = docs.length;

  return (
    <AppShell>
      <div className="h-full overflow-hidden" style={{ display: "flex", background: "var(--surface)" }}>

        {/* ── Main content ── */}
        <div className="h-full overflow-y-auto" style={{ flex: 1 }}>
          <div className="px-6 py-5" style={{ maxWidth: "860px" }}>

            {/* Header */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={11} color="var(--text-muted)" strokeWidth={2} />
                <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>{today}</p>
              </div>
              <h1 style={{ fontSize: "19px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.4px", marginBottom: "4px" }}>
                {greeting}{userName ? `, ${userName}` : ""}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                {!loading && connectedCount > 0 && (
                  <span className="px-2.5 py-1 rounded-full" style={{ fontSize: "11px", fontWeight: 600, background: "#EFF6FF", color: "#1D4ED8" }}>
                    {connectedCount} source{connectedCount !== 1 ? "s" : ""} connected
                  </span>
                )}
                {!loading && totalDocs > 0 && (
                  <span className="px-2.5 py-1 rounded-full" style={{ fontSize: "11px", fontWeight: 600, background: "#F0FDF4", color: "#166534" }}>
                    {totalDocs} doc{totalDocs !== 1 ? "s" : ""} indexed
                  </span>
                )}
                {!loading && connectedCount === 0 && (
                  <span className="px-2.5 py-1 rounded-full" style={{ fontSize: "11px", fontWeight: 600, background: "#FFF7ED", color: "#C2410C" }}>
                    No sources connected yet
                  </span>
                )}
              </div>
            </div>

            {/* Grid */}
            <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>

              {/* Slack */}
              <SectionCard
                icon={MessageSquare}
                title="Slack Messages"
                count={slackConnected ? slackDocs.length : undefined}
                action={slackConnected && slackDocs.length > 0 ? "Open Slack" : undefined}
              >
                {loading ? (
                  <LoadingRows n={2} />
                ) : !slackConnected ? (
                  <ConnectPrompt provider="slack" label="Slack" />
                ) : slackDocs.length === 0 ? (
                  <div className="flex flex-col items-center py-6 gap-2 text-center">
                    <RefreshCw size={16} color="var(--text-muted)" strokeWidth={1.5} />
                    <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Syncing Slack messages…</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {slackDocs.slice(0, 4).map((s) => (
                      <div key={s.id} className="px-3 py-2.5 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span style={{ fontSize: "10px", fontWeight: 700, color: "#4A154B", letterSpacing: "0.02em" }}>
                            {s.doc_type === "message" ? "Message" : s.doc_type ?? "Slack"}
                          </span>
                          <span className="ml-auto" style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                            {relativeTime(s.indexed_at)}
                          </span>
                        </div>
                        <p style={{ fontSize: "12px", color: "var(--text-primary)", lineHeight: 1.45, fontWeight: 500, marginBottom: "8px" }}>
                          {s.title}
                        </p>
                        <div className="flex gap-2">
                          {s.url && (
                            <a href={s.url} target="_blank" rel="noreferrer" style={{ fontSize: "11px", fontWeight: 600, color: "white", background: "var(--blue)", border: "none", borderRadius: "6px", padding: "4px 10px", cursor: "pointer", fontFamily: "Inter, sans-serif", textDecoration: "none" }}>
                              Open
                            </a>
                          )}
                          <AskSeamBtn query={s.title} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              {/* Jira */}
              <SectionCard
                icon={CheckSquare}
                title="Jira Issues"
                count={jiraConnected ? jiraDocs.length : undefined}
                action={jiraConnected && jiraDocs.length > 0 ? "Open Jira" : undefined}
              >
                {loading ? (
                  <LoadingRows n={3} />
                ) : !jiraConnected ? (
                  <ConnectPrompt provider="jira" label="Jira" />
                ) : jiraDocs.length === 0 ? (
                  <div className="flex flex-col items-center py-6 gap-2 text-center">
                    <RefreshCw size={16} color="var(--text-muted)" strokeWidth={1.5} />
                    <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Syncing Jira issues…</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {jiraDocs.slice(0, 4).map((j) => (
                      <div key={j.id} className="px-3 py-2.5 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", fontFamily: "monospace", letterSpacing: "0.02em" }}>
                            {j.doc_type?.toUpperCase() ?? "ISSUE"}
                          </span>
                          {j.author && (
                            <span className="ml-auto" style={{ fontSize: "10px", color: "var(--text-muted)" }}>{j.author}</span>
                          )}
                        </div>
                        <p style={{ fontSize: "12.5px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "6px", lineHeight: 1.35 }}>
                          {j.title}
                        </p>
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                            {j.last_modified ? relativeTime(j.last_modified) : relativeTime(j.indexed_at)}
                          </span>
                          <div className="flex gap-2 ml-auto">
                            {j.url && (
                              <a href={j.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-2.5 py-1 rounded" style={{ fontSize: "11px", color: "var(--text-secondary)", background: "var(--surface)", border: "1px solid var(--border)", cursor: "pointer", fontFamily: "Inter, sans-serif", textDecoration: "none" }}>
                                Open <ExternalLink size={9} strokeWidth={2} />
                              </a>
                            )}
                            <AskSeamBtn query={j.title} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              {/* Recent docs — full width */}
              <SectionCard
                icon={FileText}
                title="Recently Indexed"
                count={recentDocs.length}
                fullWidth
              >
                {loading ? (
                  <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} style={{ height: "100px", borderRadius: "8px", background: "var(--surface)", border: "1px solid var(--border)", animation: "pulse 1.5s ease-in-out infinite" }} />
                    ))}
                  </div>
                ) : recentDocs.length === 0 ? (
                  <div className="flex flex-col items-center py-8 gap-3 text-center">
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)" }}>
                      <FileText size={16} color="var(--text-muted)" strokeWidth={1.5} />
                    </div>
                    <p style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-secondary)" }}>No documents indexed yet</p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.5 }}>
                      Connect a source and sync it to see your documents here.
                    </p>
                    <button onClick={() => router.push("/app/integrations")} style={{ fontSize: "11.5px", fontWeight: 600, color: "#4F6BF5", background: "rgba(79,107,245,0.08)", border: "1.5px solid rgba(79,107,245,0.20)", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                      Go to Integrations →
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                    {recentDocs.map((d) => {
                      const color = PROVIDER_COLOR[d.provider] ?? "#888";
                      const label = PROVIDER_LABEL[d.provider] ?? d.provider;
                      return (
                        <div key={d.id} className="flex flex-col rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
                          <div style={{ height: "3px", background: color }} />
                          <div className="px-3 py-3 flex flex-col gap-1.5 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span style={{ fontSize: "9px", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                {label}
                              </span>
                              <span className="ml-auto" style={{ fontSize: "9px", color: "var(--text-muted)" }}>
                                {relativeTime(d.indexed_at)}
                              </span>
                            </div>
                            <p style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.4, flex: 1 }}>
                              {d.title || "Untitled"}
                            </p>
                            {d.author && (
                              <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{d.author}</p>
                            )}
                            <div className="flex gap-2 mt-auto pt-2">
                              {d.url && (
                                <a href={d.url} target="_blank" rel="noreferrer" className="flex-1 py-1.5 rounded text-center text-white transition-opacity hover:opacity-90" style={{ fontSize: "11px", fontWeight: 600, background: "var(--blue)", textDecoration: "none", fontFamily: "Inter, sans-serif" }}>
                                  Open
                                </a>
                              )}
                              <AskSeamBtn query={d.title || "this document"} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </SectionCard>

            </div>
          </div>
        </div>

        {/* ── Recent Threads sidebar ── */}
        <div style={{ width: "252px", minWidth: "252px", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", background: "#FFFFFF", height: "100%", overflow: "hidden" }}>
          <div style={{ padding: "16px 16px 10px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "7px", background: "rgba(79,107,245,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Clock size={11} color="#4F6BF5" strokeWidth={2.2} />
              </div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.1px" }}>Recent Threads</span>
            </div>
            <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>Your last 5 searches — click to reopen</p>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            {threads.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "180px", gap: "8px", textAlign: "center", padding: "0 16px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Search size={16} color="var(--text-muted)" strokeWidth={1.5} />
                </div>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>No searches yet</p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.55 }}>Your searches will appear here automatically.</p>
                <button onClick={() => router.push("/app")} style={{ marginTop: "4px", fontSize: "11.5px", fontWeight: 600, color: "#4F6BF5", background: "rgba(79,107,245,0.08)", border: "1.5px solid rgba(79,107,245,0.20)", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                  Start searching →
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {threads.map((t, i) => (
                  <button key={t.id} onClick={() => router.push(`/app/search?q=${encodeURIComponent(t.query)}`)}
                    style={{ display: "flex", alignItems: "flex-start", gap: "9px", padding: "10px 10px", borderRadius: "9px", background: "transparent", border: "1px solid transparent", cursor: "pointer", textAlign: "left", fontFamily: "Inter, sans-serif", transition: "all 0.12s", width: "100%" }}
                    onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "var(--surface)"; el.style.borderColor = "var(--border)"; }}
                    onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.borderColor = "transparent"; }}>
                    <span style={{ width: "16px", height: "16px", borderRadius: "5px", background: i === 0 ? "rgba(79,107,245,0.12)" : "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8.5px", fontWeight: 700, color: i === 0 ? "#4F6BF5" : "var(--text-muted)", flexShrink: 0, marginTop: "1px", border: "1px solid var(--border)" }}>
                      {i + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.4, marginBottom: "2px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {t.query}
                      </p>
                      <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>{relativeTime(t.ts)}</p>
                    </div>
                    <ArrowUpRight size={11} color="var(--text-muted)" strokeWidth={2} style={{ flexShrink: 0, marginTop: "2px", opacity: 0.5 }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ padding: "10px 12px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
            <button onClick={() => router.push("/app")} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "8px", borderRadius: "9px", fontSize: "12px", fontWeight: 600, color: "#4F6BF5", background: "rgba(79,107,245,0.06)", border: "1.5px solid rgba(79,107,245,0.18)", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
              <Search size={12} strokeWidth={2} /> New search
            </button>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
