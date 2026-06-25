"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, AlertCircle, RefreshCw, Plug, ChevronRight, Clock, Zap, Search, ArrowRight } from "lucide-react";
import AppShell from "../../components/AppShell";
import ConnectorIcon, { CONNECTORS, type ConnectorId } from "../../components/ConnectorIcon";
import Celebration from "../../components/Celebration";

type ConnectorStatus = "connected" | "disconnected" | "error" | "syncing";

interface Connector {
  id: ConnectorId;
  name: string;
  description: string;
  category: "P0" | "P1";
  status: ConnectorStatus;
  lastSynced: string | null;
  docsIndexed: number | null;
  syncStrategy: string;
  permissions: string[];
}

const CONNECTOR_LIST: Connector[] = [
  {
    id: "notion",
    name: "Notion",
    description: "Pages, databases, and comments",
    category: "P0",
    status: "disconnected",
    lastSynced: null,
    docsIndexed: null,
    syncStrategy: "Polling (15 min)",
    permissions: ["Read pages", "Read databases", "Read comments"],
  },
  {
    id: "jira",
    name: "Jira",
    description: "Tickets, comments, status changes, and custom fields",
    category: "P0",
    status: "disconnected",
    lastSynced: null,
    docsIndexed: null,
    syncStrategy: "Polling (15 min)",
    permissions: ["Read issues", "Read comments", "Read projects"],
  },
  {
    id: "slack",
    name: "Slack",
    description: "Public channels, threads, and @mentions — searched live via MCP",
    category: "P0",
    status: "disconnected",
    lastSynced: null,
    docsIndexed: null,
    syncStrategy: "Live (MCP)",
    permissions: ["Read messages", "Read channels", "Read threads"],
  },
  {
    id: "google-docs",
    name: "Google Workspace",
    description: "Docs, Sheets, Slides, and PowerPoint files from Drive",
    category: "P0",
    status: "disconnected",
    lastSynced: null,
    docsIndexed: null,
    syncStrategy: "Polling (15 min)",
    permissions: ["Read Drive files", "Export Docs/Sheets/Slides"],
  },
];

const STATUS_CONFIG: Record<ConnectorStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  connected:    { label: "Connected",     color: "#065F46", bg: "#ECFDF5", icon: CheckCircle },
  disconnected: { label: "Not connected", color: "#6B7280", bg: "#F9FAFB", icon: Plug },
  error:        { label: "Auth error",    color: "#B91C1C", bg: "#FEF2F2", icon: AlertCircle },
  syncing:      { label: "Syncing…",      color: "#1D4ED8", bg: "#EFF6FF", icon: RefreshCw },
};

// ── Guided connect checklist (from onboarding) ────────────────────────────────

function OnboardingConnectGuide({
  pendingSources,
  connectors,
  connecting,
  onConnect,
  onDismiss,
}: {
  pendingSources: ConnectorId[];
  connectors: Connector[];
  connecting: string | null;
  onConnect: (id: ConnectorId) => void;
  onDismiss: () => void;
}) {
  const router = useRouter();

  const items = pendingSources.map((id) => connectors.find((c) => c.id === id)).filter((c): c is Connector => !!c);
  const connectedCount = items.filter((c) => c.status === "connected" || c.status === "syncing").length;
  const allConnected = items.length > 0 && connectedCount === items.length;

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: "16px",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-card)",
        padding: "20px 22px",
        marginBottom: "20px",
      }}
    >
      {allConnected ? (
        <>
          <div className="flex items-center gap-2.5 mb-2">
            <span style={{ fontSize: "20px" }}>🎉</span>
            <h2 style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.3px" }}>
              You&apos;re all set!
            </h2>
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "16px" }}>
            All {items.length} tool{items.length > 1 ? "s" : ""} you picked {items.length > 1 ? "are" : "is"} connected. Seam is indexing your content now — most of it will be searchable within 15 minutes.
          </p>
          <button
            onClick={() => {
              onDismiss();
              router.push("/app");
            }}
            className="flex items-center justify-center gap-2"
            style={{
              padding: "12px 22px",
              borderRadius: "12px",
              background: "#4F6BF5",
              color: "white",
              fontSize: "13.5px",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
              boxShadow: "0 4px 16px rgba(79,107,245,0.3)",
            }}
          >
            <Search size={15} strokeWidth={2.5} />
            Start searching
            <ArrowRight size={14} strokeWidth={2.5} />
          </button>
        </>
      ) : (
        <>
          <h2 style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.3px", marginBottom: "4px" }}>
            Connect your tools
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "14px" }}>
            You picked {items.length} tool{items.length > 1 ? "s" : ""} during signup. Connect each one below so Seam can search your real content — {connectedCount} of {items.length} done.
          </p>

          <div className="flex flex-col gap-2 mb-4">
            {items.map((c) => {
              const isConnected = c.status === "connected";
              const isSyncing = c.status === "syncing";
              const isConnecting = connecting === c.id;
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <div className="rounded-lg overflow-hidden flex-shrink-0" style={{ width: "28px", height: "28px" }}>
                    <ConnectorIcon id={c.id as ConnectorId} size={28} />
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", flex: 1 }}>
                    {c.name}
                  </span>
                  {isSyncing ? (
                    <span className="flex items-center gap-1.5" style={{ fontSize: "12px", fontWeight: 600, color: "#1D4ED8" }}>
                      <RefreshCw size={13} strokeWidth={2.2} style={{ animation: "spin 1.2s linear infinite" }} />
                      Indexing…
                    </span>
                  ) : isConnected ? (
                    <span className="flex items-center gap-1.5" style={{ fontSize: "12px", fontWeight: 600, color: "#065F46" }}>
                      <CheckCircle size={13} strokeWidth={2.2} />
                      Connected
                    </span>
                  ) : (
                    <button
                      onClick={() => onConnect(c.id as ConnectorId)}
                      disabled={isConnecting}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "8px",
                        background: isConnecting ? "var(--border)" : "#4F6BF5",
                        color: "white",
                        fontSize: "12px",
                        fontWeight: 700,
                        border: "none",
                        cursor: isConnecting ? "default" : "pointer",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      {isConnecting ? "Connecting…" : "Connect"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={onDismiss}
            style={{
              padding: "6px 0",
              background: "none",
              border: "none",
              fontSize: "12px",
              color: "#9CA3AF",
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
              textDecoration: "underline",
            }}
          >
            Skip for now — I&apos;ll connect later
          </button>
        </>
      )}
    </div>
  );
}

// ── Connector Row ─────────────────────────────────────────────────────────────

function ConnectorRow({ connector, onConnect, onSync, onDisconnect, connecting }: { connector: Connector; onConnect: (id: ConnectorId) => void; onSync: (id: ConnectorId) => void; onDisconnect: (id: ConnectorId) => void; connecting: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[connector.status];
  const StatusIcon = status.icon;
  const iconId = connector.id as ConnectorId;

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{
        border: `1px solid ${connector.status === "error" ? "#FECACA" : "var(--border)"}`,
        boxShadow: "var(--shadow-card)",
        background: "#FFFFFF",
      }}
    >
      <div className="flex items-center gap-4 px-4 py-3.5">
        <div className="flex-shrink-0 rounded-xl overflow-hidden" style={{ width: "40px", height: "40px" }}>
          <ConnectorIcon id={iconId} size={40} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text-primary)" }}>
              {connector.name}
            </span>
            <span className="px-1.5 py-0.5 rounded"
              style={{
                fontSize: "9px",
                fontWeight: 700,
                background: connector.category === "P0" ? "#EFF6FF" : "#F5F3FF",
                color: connector.category === "P0" ? "#1D4ED8" : "#6D28D9",
                letterSpacing: "0.04em",
              }}>
              {connector.category}
            </span>
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
            {connector.description}
          </p>
        </div>

        {connector.docsIndexed !== null && connector.status !== "syncing" && (
          <div className="text-right flex-shrink-0" style={{ minWidth: "76px" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
              {connector.docsIndexed.toLocaleString("en-IN")}
            </p>
            <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>docs indexed</p>
          </div>
        )}
        {connector.status === "syncing" && (
          <div className="flex-shrink-0" style={{ minWidth: "76px", textAlign: "right" }}>
            <RefreshCw size={14} color="var(--blue)" strokeWidth={2}
              style={{ display: "inline-block", animation: "spin 1.2s linear infinite" }} />
          </div>
        )}

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ background: status.bg, minWidth: "108px", justifyContent: "center" }}>
          <StatusIcon size={11} color={status.color} strokeWidth={2.2} />
          <span style={{ fontSize: "11px", fontWeight: 600, color: status.color }}>{status.label}</span>
        </div>

        {connector.lastSynced && connector.status !== "disconnected" && (
          <div className="flex items-center gap-1 flex-shrink-0" style={{ minWidth: "86px" }}>
            <Clock size={10} color="var(--text-muted)" strokeWidth={2} />
            <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>{connector.lastSynced}</span>
          </div>
        )}

        <div className="flex items-center gap-2 flex-shrink-0">
          {connector.status === "connected" && (
            <>
              <button
                onClick={() => onSync(connector.id as ConnectorId)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-secondary)", background: "var(--surface)", border: "1px solid var(--border)", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                <RefreshCw size={10} strokeWidth={2} /> Sync now
              </button>
              <button onClick={() => setExpanded(!expanded)}
                className="flex items-center justify-center rounded-lg"
                style={{ width: "30px", height: "30px", color: "var(--text-muted)", background: "none", border: "1px solid var(--border)", cursor: "pointer", transform: expanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                <ChevronRight size={13} strokeWidth={2} />
              </button>
            </>
          )}
          {connector.status === "disconnected" && (
            <button
              onClick={() => onConnect(connector.id as ConnectorId)}
              disabled={connecting === connector.id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white font-semibold transition-opacity hover:opacity-90"
              style={{ fontSize: "11px", background: "var(--blue)", border: "none", cursor: connecting === connector.id ? "wait" : "pointer", fontFamily: "Inter, sans-serif", opacity: connecting === connector.id ? 0.7 : 1 }}>
              {connecting === connector.id ? <RefreshCw size={11} strokeWidth={2} style={{ animation: "spin 1s linear infinite" }} /> : <Plug size={11} strokeWidth={2} />}
              {connecting === connector.id ? "Connecting…" : "Connect"}
            </button>
          )}
          {connector.status === "error" && (
            <button
              onClick={() => onConnect(connector.id as ConnectorId)}
              disabled={connecting === connector.id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold"
              style={{ fontSize: "11px", background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA", cursor: connecting === connector.id ? "wait" : "pointer", fontFamily: "Inter, sans-serif", opacity: connecting === connector.id ? 0.7 : 1 }}>
              <AlertCircle size={11} strokeWidth={2} /> {connecting === connector.id ? "Connecting…" : "Reconnect"}
            </button>
          )}
          {connector.status === "syncing" && (
            <button disabled
              style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-muted)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "6px 12px", cursor: "not-allowed", fontFamily: "Inter, sans-serif" }}>
              Syncing…
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 py-3 flex gap-8" style={{ borderTop: "1px solid var(--border)", background: "var(--surface)" }}>
          <div>
            <p style={{ fontSize: "10.5px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
              Sync strategy
            </p>
            <div className="flex items-center gap-1.5">
              <Zap size={11} color="var(--blue)" strokeWidth={2} />
              <span style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: 500 }}>{connector.syncStrategy}</span>
            </div>
          </div>
          <div>
            <p style={{ fontSize: "10.5px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
              Permissions granted
            </p>
            <div className="flex flex-wrap gap-1.5">
              {connector.permissions.map((p) => (
                <span key={p} className="px-2 py-0.5 rounded-full"
                  style={{ fontSize: "11px", background: "#FFFFFF", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                  {p}
                </span>
              ))}
            </div>
          </div>
          <div className="ml-auto">
            <button
              onClick={() => onDisconnect(connector.id as ConnectorId)}
              style={{ fontSize: "11px", color: "#B91C1C", background: "none", border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif", fontWeight: 500 }}>
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Inner page (reads search params) ─────────────────────────────────────────

function IntegrationsInner() {
  const searchParams = useSearchParams();
  const isNew = searchParams.get("new") === "1";

  const connectedParam = searchParams.get("connected") as ConnectorId | null;
  const errorParam = searchParams.get("error");

  const [celebId, setCelebId] = useState<ConnectorId | null>(connectedParam);
  const [connectors, setConnectors] = useState<Connector[]>(
    CONNECTOR_LIST.map((c) => ({ ...c, status: "disconnected" as ConnectorStatus, lastSynced: null, docsIndexed: null }))
  );
  const [connecting, setConnecting] = useState<string | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(errorParam);
  const [pendingSources, setPendingSources] = useState<ConnectorId[]>(
    isNew ? (CONNECTOR_LIST.filter((c) => c.category === "P0").map((c) => c.id as ConnectorId)) : []
  );

  const dismissGuide = () => {
    setPendingSources([]);
  };

  // Kick off sync automatically after returning from OAuth
  useEffect(() => {
    if (!connectedParam) return;
    fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: connectedParam }),
    }).then(async (r) => {
      const data = await r.json().catch(() => ({}));
      setConnectors((prev) => prev.map((c) => c.id === connectedParam ? {
        ...c,
        status: r.ok ? "connected" as ConnectorStatus : "error" as ConnectorStatus,
        docsIndexed: r.ok ? (data.docsIndexed ?? c.docsIndexed) : c.docsIndexed,
        lastSynced: r.ok ? "just now" : c.lastSynced,
      } : c));
    }).catch(() => {
      setConnectors((prev) => prev.map((c) => c.id === connectedParam ? { ...c, status: "error" as ConnectorStatus } : c));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load real connection status + docs indexed via server-side API (avoids browser RLS/session issues)
  useEffect(() => {
    fetch("/api/sources")
      .then((r) => r.json())
      .then(({ sources = [] }: { sources: { provider: string; status: string; last_synced_at: string | null; metadata: Record<string, unknown> | null }[] }) => {
        setConnectors((prev) => prev.map((c) => {
          const source = sources.find((s) => s.provider === c.id);
          if (!source) return { ...c, status: "disconnected" as ConnectorStatus, lastSynced: null, docsIndexed: null };
          const docsIndexed = (source.metadata as { docs_indexed?: number } | null)?.docs_indexed ?? null;
          const lastSynced = source.last_synced_at
            ? new Date(source.last_synced_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
            : null;
          return { ...c, status: source.status as ConnectorStatus, lastSynced, docsIndexed };
        }));
      })
      .catch(() => {});
  }, []);

  const handleConnect = async (id: ConnectorId) => {
    setConnecting(id);
    setOauthError(null);
    try {
      const res = await fetch("/api/oauth/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: id }),
      });
      const { url, error } = await res.json();
      if (error) { setOauthError(error); setConnecting(null); return; }
      window.location.href = url;
    } catch (err) {
      setOauthError(err instanceof Error ? err.message : "Failed to start connection");
      setConnecting(null);
    }
  };

  const handleDisconnect = async (id: ConnectorId) => {
    if (!window.confirm(`Disconnect ${id}? You can reconnect anytime.`)) return;
    await fetch(`/api/sources?provider=${id}`, { method: "DELETE" });
    setConnectors((prev) => prev.map((c) => c.id === id
      ? { ...c, status: "disconnected" as ConnectorStatus, lastSynced: null, docsIndexed: null }
      : c
    ));
  };

  const handleSync = async (id: ConnectorId) => {
    setConnectors((prev) => prev.map((c) => c.id === id ? { ...c, status: "syncing" as ConnectorStatus } : c));
    try {
      const r = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: id }),
      });
      const data = await r.json().catch(() => ({}));
      setConnectors((prev) => prev.map((c) => c.id === id ? {
        ...c,
        status: r.ok ? "connected" as ConnectorStatus : "error" as ConnectorStatus,
        docsIndexed: r.ok ? (data.docsIndexed ?? c.docsIndexed) : c.docsIndexed,
        lastSynced: r.ok ? "just now" : c.lastSynced,
      } : c));
    } catch {
      setConnectors((prev) => prev.map((c) => c.id === id ? { ...c, status: "error" as ConnectorStatus } : c));
    }
  };

  const p0 = connectors.filter((c) => c.category === "P0");
  const p1 = connectors.filter((c) => c.category === "P1");
  const connected = connectors.filter((c) => c.status === "connected").length;
  const total = connectors.length;
  const totalDocs = connectors.reduce((sum, c) => sum + (c.docsIndexed ?? 0), 0);

  return (
    <AppShell>
      {celebId && (
        <Celebration
          connectedId={celebId}
          onDismiss={() => setCelebId(null)}
          progress={
            pendingSources.length > 0
              ? {
                  connected: pendingSources.filter((id) => {
                    const s = connectors.find((c) => c.id === id)?.status;
                    return s === "connected" || s === "syncing";
                  }).length,
                  total: pendingSources.length,
                }
              : undefined
          }
        />
      )}
      <div className="h-full overflow-y-auto" style={{ background: "var(--surface)" }}>
        <div className="px-6 py-5" style={{ maxWidth: "900px" }}>

          {oauthError && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4"
              style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
              <AlertCircle size={13} color="#B91C1C" strokeWidth={2.2} />
              <span style={{ fontSize: "12px", color: "#B91C1C", flex: 1 }}>
                Connection failed: {oauthError}
              </span>
              <button onClick={() => setOauthError(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#B91C1C", fontSize: "16px", lineHeight: 1 }}>
                ×
              </button>
            </div>
          )}

          <div className="mb-5">
            <h1 style={{ fontSize: "19px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.4px", marginBottom: "4px" }}>
              Integrations
            </h1>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>
              Connect your tools. Seam searches everything you connect.
            </p>

            {pendingSources.length > 0 && (
              <OnboardingConnectGuide
                pendingSources={pendingSources}
                connectors={connectors}
                connecting={connecting}
                onConnect={handleConnect}
                onDismiss={dismissGuide}
              />
            )}

            <div className="flex items-center gap-5 px-4 py-3 rounded-xl"
              style={{ background: "#FFFFFF", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
              <div>
                <p style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1, letterSpacing: "-0.5px" }}>
                  {connected}/{total}
                </p>
                <p style={{ fontSize: "10.5px", color: "var(--text-muted)", marginTop: "2px" }}>connected</p>
              </div>
              <div style={{ width: "1px", height: "32px", background: "var(--border)" }} />
              <div>
                <p style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1, letterSpacing: "-0.5px" }}>
                  {totalDocs.toLocaleString("en-IN")}
                </p>
                <p style={{ fontSize: "10.5px", color: "var(--text-muted)", marginTop: "2px" }}>docs indexed</p>
              </div>
              <div style={{ width: "1px", height: "32px", background: "var(--border)" }} />

              <div className="flex items-center gap-2">
                {connectors.filter((c) => c.status === "connected").map((c) => (
                  <div key={c.id} className="rounded-lg overflow-hidden" style={{ width: "24px", height: "24px" }}>
                    <ConnectorIcon id={c.id as ConnectorId} size={24} />
                  </div>
                ))}
              </div>

              {connectors.some((c) => c.status === "error") && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg ml-auto flex-shrink-0"
                  style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
                  <AlertCircle size={12} color="#B91C1C" strokeWidth={2.2} />
                  <span style={{ fontSize: "11.5px", fontWeight: 600, color: "#B91C1C" }}>
                    {connectors.find((c) => c.status === "error")?.name} needs reauth
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 rounded"
                style={{ fontSize: "10px", fontWeight: 700, background: "#EFF6FF", color: "#1D4ED8", letterSpacing: "0.04em" }}>P0</span>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>Core connectors</span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>— required for Knowledge Search</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {p0.map((c) => <ConnectorRow key={c.id} connector={c} onConnect={handleConnect} onSync={handleSync} onDisconnect={handleDisconnect} connecting={connecting} />)}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 rounded"
                style={{ fontSize: "10px", fontWeight: 700, background: "#F5F3FF", color: "#6D28D9", letterSpacing: "0.04em" }}>P1</span>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>Extended connectors</span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>— Confluence for KB, Mixpanel for Data App</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {p1.map((c) => <ConnectorRow key={c.id} connector={c} onConnect={handleConnect} onSync={handleSync} onDisconnect={handleDisconnect} connecting={connecting} />)}
            </div>
          </div>

          <div className="flex items-start gap-2 mt-5 px-4 py-3 rounded-xl"
            style={{ background: "#FFFFFF", border: "1px solid var(--border)" }}>
            <Plug size={13} color="var(--text-muted)" strokeWidth={2} style={{ marginTop: "1px", flexShrink: 0 }} />
            <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Seam connects via OAuth — <strong style={{ color: "var(--text-primary)" }}>read-only</strong>, never writes to your tools. Revoke access anytime from your Google or Notion account settings.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// ── Page export (Suspense boundary for useSearchParams) ───────────────────────

export default function IntegrationsPage() {
  return (
    <Suspense fallback={null}>
      <IntegrationsInner />
    </Suspense>
  );
}
