"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, AlertCircle, RefreshCw, Plug, ChevronRight, Clock, Zap, Search, ArrowRight } from "lucide-react";
import AppShell from "../../components/AppShell";
import ConnectorIcon, { CONNECTORS, type ConnectorId } from "../../components/ConnectorIcon";
import Celebration from "../../components/Celebration";

type ConnectorStatus = "connected" | "disconnected" | "error" | "syncing";

interface Connector {
  id: ConnectorId | "google-calendar";
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
    status: "connected",
    lastSynced: "2 min ago",
    docsIndexed: 1842,
    syncStrategy: "Webhook",
    permissions: ["Read pages", "Read databases", "Read comments"],
  },
  {
    id: "jira",
    name: "Jira",
    description: "Tickets, comments, status changes, and custom fields",
    category: "P0",
    status: "connected",
    lastSynced: "5 min ago",
    docsIndexed: 3210,
    syncStrategy: "Webhook",
    permissions: ["Read issues", "Read comments", "Read projects"],
  },
  {
    id: "google-docs",
    name: "Google Docs & Sheets",
    description: "Docs, Sheets, and Slides with full content and comments",
    category: "P0",
    status: "connected",
    lastSynced: "12 min ago",
    docsIndexed: 614,
    syncStrategy: "Polling (15 min)",
    permissions: ["Read Drive files", "Read comments", "Read metadata"],
  },
  {
    id: "calendar",
    name: "Google Calendar",
    description: "Meetings, attendees, and recurring events",
    category: "P0",
    status: "connected",
    lastSynced: "1 min ago",
    docsIndexed: 280,
    syncStrategy: "Webhook",
    permissions: ["Read events", "Read attendees"],
  },
  {
    id: "slack",
    name: "Slack",
    description: "Public channels, threads, and @mentions — bots excluded",
    category: "P0",
    status: "error",
    lastSynced: "3h ago",
    docsIndexed: 9440,
    syncStrategy: "Webhook",
    permissions: ["Read messages", "Read channels", "Read threads"],
  },
  {
    id: "confluence",
    name: "Confluence",
    description: "Spaces, pages, and inline comments",
    category: "P1",
    status: "disconnected",
    lastSynced: null,
    docsIndexed: null,
    syncStrategy: "Polling (30 min)",
    permissions: ["Read spaces", "Read pages", "Read comments"],
  },
  {
    id: "mixpanel",
    name: "Mixpanel",
    description: "Event trends, funnel data, and retention",
    category: "P1",
    status: "syncing",
    lastSynced: "Syncing…",
    docsIndexed: null,
    syncStrategy: "API Pull (hourly)",
    permissions: ["Read events", "Read funnels", "Read retention"],
  },
];

const STATUS_CONFIG: Record<ConnectorStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  connected:    { label: "Connected",     color: "#065F46", bg: "#ECFDF5", icon: CheckCircle },
  disconnected: { label: "Not connected", color: "#6B7280", bg: "#F9FAFB", icon: Plug },
  error:        { label: "Auth error",    color: "#B91C1C", bg: "#FEF2F2", icon: AlertCircle },
  syncing:      { label: "Syncing…",      color: "#1D4ED8", bg: "#EFF6FF", icon: RefreshCw },
};

// ── Welcome Popup (from onboarding) ──────────────────────────────────────────

// Circle r=44, circumference ≈ 276.5
const RING_CIRCUM = 2 * Math.PI * 44;

function WelcomePopup({ onStay }: { onStay: () => void }) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [count, setCount] = useState(3);
  const [ringKey, setRingKey] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(true);
      setRingKey((k) => k + 1);
    }, 120);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!visible) return;
    if (count <= 0) return;
    const t = setTimeout(() => {
      setCount((c) => c - 1);
    }, 1000);
    return () => clearTimeout(t);
  }, [visible, count]);

  useEffect(() => {
    if (count === 0) {
      const t = setTimeout(() => router.push("/app"), 500);
      return () => clearTimeout(t);
    }
  }, [count, router]);

  const goNow = () => router.push("/app");

  const connectedTools = CONNECTOR_LIST.filter((c) => c.status === "connected").slice(0, 4);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,17,23,0.55)",
        backdropFilter: "blur(6px)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "28px",
          padding: "36px 36px 28px",
          maxWidth: "380px",
          width: "calc(100% - 48px)",
          textAlign: "center",
          boxShadow: "0 32px 80px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.08)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.94)",
          transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Seam logo */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "3px", marginBottom: "20px" }}>
          <span style={{ fontWeight: 900, fontSize: "22px", color: "#1C1E26", letterSpacing: "-1.2px", fontFamily: "Inter, sans-serif" }}>
            seam
          </span>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4F6BF5", display: "inline-block", marginBottom: "3px", boxShadow: "0 0 8px rgba(79,107,245,0.6)" }} />
        </div>

        {/* Countdown ring */}
        <div style={{ position: "relative", width: "100px", height: "100px", margin: "0 auto 20px" }}>
          <svg width="100" height="100" viewBox="0 0 100 100">
            {/* Track */}
            <circle cx="50" cy="50" r="44" fill="none" stroke="#EEF0F6" strokeWidth="5" />
            {/* Animated drain ring */}
            {visible && (
              <circle
                key={ringKey}
                cx="50" cy="50" r="44"
                fill="none"
                stroke="#4F6BF5"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUM}
                strokeDashoffset="0"
                style={{
                  transformOrigin: "50px 50px",
                  transform: "rotate(-90deg)",
                  animation: "drainRing 3s linear forwards",
                }}
              />
            )}
          </svg>

          {/* Number */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: count === 0 ? "26px" : "34px",
              fontWeight: 900,
              color: count === 0 ? "#4F6BF5" : "#111827",
              letterSpacing: "-1px",
              fontFamily: "Inter, sans-serif",
              transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            {count === 0 ? "✦" : count}
          </div>
        </div>

        {/* Heading */}
        <h2 style={{ fontSize: "19px", fontWeight: 900, color: "#111827", letterSpacing: "-0.6px", marginBottom: "8px", fontFamily: "Inter, sans-serif" }}>
          Your workspace is ready
        </h2>

        {/* Tool icons */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "12px" }}>
          {connectedTools.map((c) => (
            <div key={c.id} style={{ width: "32px", height: "32px", borderRadius: "8px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
              <ConnectorIcon id={c.id as ConnectorId} size={32} />
            </div>
          ))}
          <span style={{ fontSize: "12px", color: "#9CA3AF", fontFamily: "Inter, sans-serif" }}>+{CONNECTOR_LIST.filter(c => c.status === "connected").length - 4 > 0 ? CONNECTOR_LIST.filter(c => c.status === "connected").length - 4 : ""} more</span>
        </div>

        <p style={{ fontSize: "13px", color: "#6B7280", lineHeight: 1.65, marginBottom: "24px", fontFamily: "Inter, sans-serif" }}>
          Seam is indexing everything. Most content searchable within{" "}
          <strong style={{ color: "#111827" }}>15 minutes</strong>.<br />
          Let's pull your first thread.
        </p>

        {/* CTA */}
        <button
          onClick={goNow}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "14px 24px",
            borderRadius: "14px",
            background: "#4F6BF5",
            color: "white",
            fontSize: "14.5px",
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
            marginBottom: "10px",
            boxShadow: "0 4px 16px rgba(79,107,245,0.35)",
          }}
        >
          <Search size={16} strokeWidth={2.5} />
          Search now
          <ArrowRight size={15} strokeWidth={2.5} />
        </button>

        {/* Secondary */}
        <button
          onClick={onStay}
          style={{
            width: "100%",
            padding: "10px",
            background: "none",
            border: "none",
            fontSize: "12.5px",
            color: "#9CA3AF",
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
          }}
        >
          Set up more sources first
        </button>

        {count > 0 && (
          <p style={{ fontSize: "11px", color: "#CBD5E1", marginTop: "4px", fontFamily: "Inter, sans-serif" }}>
            Redirecting in {count}s
          </p>
        )}
      </div>
    </div>
  );
}

// ── Connector Row ─────────────────────────────────────────────────────────────

function ConnectorRow({ connector, onConnect }: { connector: Connector; onConnect: (id: ConnectorId) => void }) {
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
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white font-semibold transition-opacity hover:opacity-90"
              style={{ fontSize: "11px", background: "var(--blue)", border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
              <Plug size={11} strokeWidth={2} /> Connect
            </button>
          )}
          {connector.status === "error" && (
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold"
              style={{ fontSize: "11px", background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
              <AlertCircle size={11} strokeWidth={2} /> Reconnect
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
            <button style={{ fontSize: "11px", color: "#B91C1C", background: "none", border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif", fontWeight: 500 }}>
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
  const fromOnboarding = searchParams.get("from") === "onboarding";

  const [celebId, setCelebId] = useState<ConnectorId | null>(null);
  const [showWelcome, setShowWelcome] = useState(fromOnboarding);

  const p0 = CONNECTOR_LIST.filter((c) => c.category === "P0");
  const p1 = CONNECTOR_LIST.filter((c) => c.category === "P1");
  const connected = CONNECTOR_LIST.filter((c) => c.status === "connected").length;
  const total = CONNECTOR_LIST.length;
  const totalDocs = CONNECTOR_LIST.reduce((sum, c) => sum + (c.docsIndexed ?? 0), 0);

  return (
    <AppShell>
      {celebId && (
        <Celebration connectedId={celebId} onDismiss={() => setCelebId(null)} />
      )}
      {showWelcome && (
        <WelcomePopup onStay={() => setShowWelcome(false)} />
      )}

      <div className="h-full overflow-y-auto" style={{ background: "var(--surface)" }}>
        <div className="px-6 py-5" style={{ maxWidth: "900px" }}>

          <div className="mb-5">
            <h1 style={{ fontSize: "19px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.4px", marginBottom: "4px" }}>
              Integrations
            </h1>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>
              Connect your tools. Seam searches everything you connect.
            </p>

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
                {CONNECTOR_LIST.filter((c) => c.status === "connected").map((c) => (
                  <div key={c.id} className="rounded-lg overflow-hidden" style={{ width: "24px", height: "24px" }}>
                    <ConnectorIcon id={c.id as ConnectorId} size={24} />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 px-3 py-2 rounded-lg ml-auto flex-shrink-0"
                style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
                <AlertCircle size={12} color="#B91C1C" strokeWidth={2.2} />
                <span style={{ fontSize: "11.5px", fontWeight: 600, color: "#B91C1C" }}>Slack needs reauth</span>
              </div>
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
              {p0.map((c) => <ConnectorRow key={c.id} connector={c} onConnect={setCelebId} />)}
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
              {p1.map((c) => <ConnectorRow key={c.id} connector={c} onConnect={setCelebId} />)}
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
