"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle, AlertCircle, RefreshCw, Plug,
  ChevronDown, Clock, Zap, ArrowRight, Shield, X, Search,
} from "lucide-react";
import AppShell from "../../components/AppShell";
import ConnectorIcon, { type ConnectorId } from "../../components/ConnectorIcon";
import Celebration from "../../components/Celebration";

// ── Types ─────────────────────────────────────────────────────────────────────

type ConnectorStatus = "connected" | "disconnected" | "error" | "syncing";

interface Connector {
  id: ConnectorId;
  name: string;
  description: string;
  category: "P0" | "P1";
  status: ConnectorStatus;
  lastSynced: string | null;
  docsIndexed: number | null;
}

// ── Connector definitions ──────────────────────────────────────────────────────

const CONNECTOR_LIST: Connector[] = [
  {
    id: "notion",
    name: "Notion",
    description: "Pages, databases, and comments — searched live via MCP",
    category: "P0",
    status: "disconnected",
    lastSynced: null,
    docsIndexed: null,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Public channels, threads, and @mentions — searched live via MCP",
    category: "P0",
    status: "disconnected",
    lastSynced: null,
    docsIndexed: null,
  },
];

// ── Feature C: What Seam reads per connector ──────────────────────────────────

const CONNECTOR_ACCESS: Record<string, { reads: string[]; doesNotRead: string[] }> = {
  notion: {
    reads: [
      "Pages and subpages your integration can access",
      "Database entries and properties",
      "Comments on pages",
      "Linked databases and rollups",
    ],
    doesNotRead: [
      "Private pages outside your connection",
      "Pages not shared with the integration",
      "Notion DMs (not available via API)",
    ],
  },
  slack: {
    reads: [
      "Public channels you're a member of",
      "Threads and replies in those channels",
      "Channel history you have access to",
    ],
    doesNotRead: [
      "Direct messages (DMs)",
      "Private channels (unless Seam bot is added)",
      "Files, images, and attachments",
    ],
  },
};

// ── Feature E: First-search queries per connector ─────────────────────────────

const CONNECTOR_FIRST_QUERY: Record<string, string> = {
  notion: "Why did we decide to build vs. buy the notification system?",
  slack: "What did the team commit to in the last product planning session?",
};

// ── Feature D: 4-Step Progress Track ─────────────────────────────────────────

const STEPS = [
  { key: "connect",   label: "Connect" },
  { key: "authorise", label: "Authorise" },
  { key: "indexing",  label: "Indexing" },
  { key: "ready",     label: "Ready" },
];

type StepState = "done" | "active" | "pending" | "error";

function stepStateFor(key: string, status: ConnectorStatus): StepState {
  if (status === "connected") return "done";
  if (status === "syncing") {
    if (key === "connect" || key === "authorise") return "done";
    if (key === "indexing") return "active";
    return "pending";
  }
  if (status === "error") {
    if (key === "connect" || key === "authorise") return "done";
    if (key === "indexing") return "error";
    return "pending";
  }
  return "pending";
}

function ProgressTrack({ status }: { status: ConnectorStatus }) {
  return (
    <>
      <style>{`
        @keyframes stepPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(79,107,245,0.55); }
          60%       { box-shadow: 0 0 0 7px rgba(79,107,245,0); }
        }
      `}</style>
      <div style={{ display: "flex", alignItems: "flex-start", padding: "16px 0 6px" }}>
        {STEPS.map((step, i) => {
          const state = stepStateFor(step.key, status);
          const isLast = i === STEPS.length - 1;
          return (
            <div key={step.key} style={{ display: "flex", alignItems: "flex-start", flex: isLast ? "initial" : 1 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                <div style={{
                  width: "26px", height: "26px", borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background:
                    state === "done"    ? "#34D399" :
                    state === "active"  ? "#4F6BF5" :
                    state === "error"   ? "#EF4444" :
                    "rgba(255,255,255,0.06)",
                  border: state === "pending" ? "1.5px solid rgba(255,255,255,0.1)" : "none",
                  animation: state === "active" ? "stepPulse 1.8s ease-in-out infinite" : "none",
                  transition: "background 0.4s ease",
                }}>
                  {state === "done"    && <CheckCircle size={13} color="white" strokeWidth={2.5} />}
                  {state === "active"  && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "white" }} />}
                  {state === "error"   && <X size={11} color="white" strokeWidth={2.5} />}
                  {state === "pending" && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "rgba(255,255,255,0.18)" }} />}
                </div>
                <span style={{
                  fontSize: "10px",
                  fontWeight: state === "active" ? 700 : 500,
                  color:
                    state === "done"    ? "rgba(255,255,255,0.65)" :
                    state === "active"  ? "#818CF8" :
                    state === "error"   ? "#FCA5A5" :
                    "rgba(255,255,255,0.28)",
                  whiteSpace: "nowrap",
                  transition: "color 0.4s ease",
                  fontFamily: "Inter, sans-serif",
                }}>
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div style={{
                  flex: 1,
                  height: "1.5px",
                  background: state === "done" ? "rgba(52,211,153,0.45)" : "rgba(255,255,255,0.07)",
                  margin: "12px 6px 0",
                  transition: "background 0.5s ease",
                }} />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── Feature C: Access Accordion ───────────────────────────────────────────────

function AccessAccordion({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const access = CONNECTOR_ACCESS[id];
  if (!access) return null;
  const name = id.charAt(0).toUpperCase() + id.slice(1);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "inline-flex", alignItems: "center", gap: "5px",
          background: "none", border: "none", cursor: "pointer", padding: 0,
          color: "rgba(255,255,255,0.45)", fontSize: "11px", fontWeight: 600,
          fontFamily: "Inter, sans-serif", transition: "color 0.15s",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.75)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)")}
      >
        <Shield size={11} strokeWidth={2} />
        What Seam reads from {name}
        <ChevronDown size={11} style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
      </button>

      {open && (
        <div style={{
          marginTop: "10px", padding: "16px 18px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "12px",
          animation: "fadeInUp 0.18s ease both",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            {/* Reads */}
            <div>
              <div style={{ fontSize: "9px", fontWeight: 700, color: "#34D399", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
                ✓ Reads
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                {access.reads.map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: "7px" }}>
                    <span style={{ color: "#34D399", fontSize: "11px", fontWeight: 700, flexShrink: 0, marginTop: "1px" }}>✓</span>
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.68)", lineHeight: 1.45 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Never reads */}
            <div>
              <div style={{ fontSize: "9px", fontWeight: 700, color: "#F87171", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
                ✗ Never reads
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                {access.doesNotRead.map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: "7px" }}>
                    <span style={{ color: "#F87171", fontSize: "11px", fontWeight: 700, flexShrink: 0, marginTop: "1px" }}>✗</span>
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.68)", lineHeight: 1.45 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Feature E: First-Search Prompt ────────────────────────────────────────────

function FirstSearchPrompt({ id }: { id: string }) {
  const router = useRouter();
  const query = CONNECTOR_FIRST_QUERY[id];
  if (!query) return null;
  const name = id.charAt(0).toUpperCase() + id.slice(1);

  return (
    <div style={{
      marginTop: "12px",
      padding: "14px 16px",
      background: "rgba(79,107,245,0.07)",
      border: "1px solid rgba(79,107,245,0.22)",
      borderRadius: "12px",
      display: "flex", alignItems: "center", gap: "12px",
      animation: "fadeInUp 0.35s ease both",
    }}>
      <Zap size={14} color="#818CF8" strokeWidth={2} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "#818CF8", marginBottom: "3px", fontFamily: "Inter, sans-serif" }}>
          {name} is live — try your first search
        </div>
        <div style={{
          fontSize: "12.5px", color: "rgba(255,255,255,0.72)", fontStyle: "italic",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          fontFamily: "Inter, sans-serif",
        }}>
          &quot;{query}&quot;
        </div>
      </div>
      <button
        onClick={() => router.push(`/app/search?q=${encodeURIComponent(query)}`)}
        style={{
          display: "inline-flex", alignItems: "center", gap: "5px",
          padding: "8px 14px", borderRadius: "9px",
          background: "#4F6BF5", color: "white",
          border: "none", cursor: "pointer",
          fontSize: "12px", fontWeight: 600,
          fontFamily: "Inter, sans-serif", flexShrink: 0,
          boxShadow: "0 2px 10px rgba(79,107,245,0.35)",
        }}
      >
        Try it <ArrowRight size={12} strokeWidth={2.5} />
      </button>
    </div>
  );
}

// ── Connector Card (dark, C + D + E) ─────────────────────────────────────────

function ConnectorCard({
  connector, onConnect, onSync, onDisconnect, connecting,
}: {
  connector: Connector;
  onConnect: (id: ConnectorId) => void;
  onSync: (id: ConnectorId) => void;
  onDisconnect: (id: ConnectorId) => void;
  connecting: string | null;
}) {
  const iconId = connector.id as ConnectorId;
  const { status } = connector;
  const isConnected   = status === "connected";
  const isDisconnected = status === "disconnected";
  const isSyncing     = status === "syncing";
  const isError       = status === "error";
  const isConnecting  = connecting === connector.id;

  const borderColor =
    isConnected  ? "rgba(52,211,153,0.2)"  :
    isSyncing    ? "rgba(79,107,245,0.22)" :
    isError      ? "rgba(239,68,68,0.25)"  :
    "rgba(255,255,255,0.07)";

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: `1px solid ${borderColor}`,
      borderRadius: "16px",
      padding: "18px 20px",
      transition: "border-color 0.35s ease",
    }}>

      {/* ── Header row ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>

        {/* Icon */}
        <div style={{ width: "40px", height: "40px", borderRadius: "12px", overflow: "hidden", flexShrink: 0 }}>
          <ConnectorIcon id={iconId} size={40} />
        </div>

        {/* Name + description */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "3px" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF", fontFamily: "Inter, sans-serif" }}>
              {connector.name}
            </span>
            <span style={{
              fontSize: "9px", fontWeight: 700, letterSpacing: "0.04em",
              background: connector.category === "P0" ? "rgba(79,107,245,0.15)" : "rgba(109,40,217,0.15)",
              color:      connector.category === "P0" ? "#818CF8" : "#A78BFA",
              border:     connector.category === "P0" ? "1px solid rgba(79,107,245,0.25)" : "1px solid rgba(109,40,217,0.25)",
              borderRadius: "4px", padding: "1px 6px",
            }}>
              {connector.category}
            </span>
          </div>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", lineHeight: 1.4, margin: 0, fontFamily: "Inter, sans-serif" }}>
            {connector.description}
          </p>
        </div>

        {/* Docs indexed count — show during syncing too so prior count stays visible */}
        {connector.docsIndexed !== null && (isConnected || isSyncing) && (
          <div style={{ textAlign: "right", flexShrink: 0, marginRight: "4px" }}>
            <div style={{ fontSize: "16px", fontWeight: 800, color: isSyncing ? "rgba(255,255,255,0.45)" : "#FFFFFF", letterSpacing: "-0.5px", lineHeight: 1, fontFamily: "Inter, sans-serif" }}>
              {connector.docsIndexed.toLocaleString()}
            </div>
            <div style={{ fontSize: "9.5px", color: "rgba(255,255,255,0.42)", marginTop: "2px", fontFamily: "Inter, sans-serif" }}>docs indexed</div>
          </div>
        )}

        {/* Status pill */}
        <div style={{ flexShrink: 0 }}>
          {isConnected && (
            <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "20px", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)" }}>
              <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#34D399" }} />
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#34D399", fontFamily: "Inter, sans-serif" }}>Connected</span>
            </div>
          )}
          {isDisconnected && (
            <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "20px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "rgba(255,255,255,0.22)" }} />
              <span style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.42)", fontFamily: "Inter, sans-serif" }}>Not connected</span>
            </div>
          )}
          {isSyncing && (
            <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "20px", background: "rgba(79,107,245,0.12)", border: "1px solid rgba(79,107,245,0.25)" }}>
              <RefreshCw size={9} color="#818CF8" strokeWidth={2} style={{ animation: "spin 1.2s linear infinite" }} />
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#818CF8", fontFamily: "Inter, sans-serif" }}>Syncing</span>
            </div>
          )}
          {isError && (
            <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "20px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.22)" }}>
              <AlertCircle size={9} color="#F87171" strokeWidth={2} />
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#F87171", fontFamily: "Inter, sans-serif" }}>Auth error</span>
            </div>
          )}
        </div>

        {/* Action button(s) */}
        <div style={{ flexShrink: 0 }}>
          {isDisconnected && (
            <button
              onClick={() => onConnect(iconId)}
              disabled={isConnecting}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "8px 16px", borderRadius: "10px",
                background: isConnecting ? "rgba(79,107,245,0.5)" : "#4F6BF5",
                color: "white", border: "none",
                cursor: isConnecting ? "default" : "pointer",
                fontSize: "12px", fontWeight: 600, fontFamily: "Inter, sans-serif",
                boxShadow: "0 2px 10px rgba(79,107,245,0.3)",
                transition: "background 0.15s",
              }}
            >
              {isConnecting
                ? <RefreshCw size={11} strokeWidth={2} style={{ animation: "spin 1s linear infinite" }} />
                : <Plug size={11} strokeWidth={2} />}
              {isConnecting ? "Connecting…" : "Connect"}
            </button>
          )}
          {isConnected && (
            <div style={{ display: "flex", gap: "7px" }}>
              <button
                onClick={() => onSync(iconId)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "5px",
                  padding: "7px 12px", borderRadius: "9px",
                  background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.68)",
                  border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer",
                  fontSize: "11px", fontWeight: 500, fontFamily: "Inter, sans-serif",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.09)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)")}
              >
                <RefreshCw size={10} strokeWidth={2} /> Sync now
              </button>
              <button
                onClick={() => onDisconnect(iconId)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "5px",
                  padding: "7px 12px", borderRadius: "9px",
                  background: "rgba(239,68,68,0.06)", color: "#F87171",
                  border: "1px solid rgba(239,68,68,0.14)", cursor: "pointer",
                  fontSize: "11px", fontWeight: 500, fontFamily: "Inter, sans-serif",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.1)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.06)")}
              >
                Disconnect
              </button>
            </div>
          )}
          {isError && (
            <button
              onClick={() => onConnect(iconId)}
              disabled={isConnecting}
              style={{
                display: "inline-flex", alignItems: "center", gap: "5px",
                padding: "8px 14px", borderRadius: "9px",
                background: "rgba(239,68,68,0.1)", color: "#F87171",
                border: "1px solid rgba(239,68,68,0.2)",
                cursor: isConnecting ? "default" : "pointer",
                fontSize: "11.5px", fontWeight: 600, fontFamily: "Inter, sans-serif",
              }}
            >
              <AlertCircle size={11} strokeWidth={2} />
              {isConnecting ? "Connecting…" : "Reconnect"}
            </button>
          )}
          {isSyncing && (
            <button disabled style={{
              padding: "7px 14px", borderRadius: "9px",
              background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)",
              border: "1px solid rgba(255,255,255,0.07)", cursor: "not-allowed",
              fontSize: "11px", fontWeight: 500, fontFamily: "Inter, sans-serif",
            }}>
              Syncing…
            </button>
          )}
        </div>
      </div>

      {/* Last synced meta (connected only) */}
      {isConnected && connector.lastSynced && (
        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "10px" }}>
          <Clock size={9} color="rgba(255,255,255,0.3)" strokeWidth={2} />
          <span style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.42)", fontFamily: "Inter, sans-serif" }}>
            Last synced {connector.lastSynced}
          </span>
        </div>
      )}

      {/* ── Feature D: Progress track (not disconnected) ── */}
      {!isDisconnected && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: "10px" }}>
          <ProgressTrack status={status} />
        </div>
      )}

      {/* ── Feature E: First-search prompt (connected) ── */}
      {isConnected && <FirstSearchPrompt id={connector.id} />}

      {/* ── Feature C: Access accordion (always) ── */}
      <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <AccessAccordion id={connector.id} />
      </div>
    </div>
  );
}

// ── Onboarding guide (dark theme) ─────────────────────────────────────────────

function OnboardingConnectGuide({
  pendingSources, connectors, connecting, onConnect, onDismiss,
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
    <div style={{
      background: "rgba(79,107,245,0.06)",
      border: "1px solid rgba(79,107,245,0.2)",
      borderRadius: "14px",
      padding: "20px 22px",
      marginBottom: "20px",
    }}>
      {allConnected ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span style={{ fontSize: "20px" }}>🎉</span>
            <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.3px", margin: 0, fontFamily: "Inter, sans-serif" }}>
              You&apos;re all set!
            </h2>
          </div>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.68)", lineHeight: 1.6, marginBottom: "16px", fontFamily: "Inter, sans-serif" }}>
            All {items.length} tool{items.length > 1 ? "s" : ""} connected. Seam is indexing your content — most will be searchable in minutes.
          </p>
          <button
            onClick={() => { onDismiss(); router.push("/app"); }}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "10px 20px", borderRadius: "10px",
              background: "#4F6BF5", color: "white",
              border: "none", cursor: "pointer",
              fontSize: "13px", fontWeight: 700, fontFamily: "Inter, sans-serif",
              boxShadow: "0 4px 16px rgba(79,107,245,0.35)",
            }}
          >
            <Search size={14} strokeWidth={2.5} />
            Start searching
            <ArrowRight size={13} strokeWidth={2.5} />
          </button>
        </>
      ) : (
        <>
          <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.3px", marginBottom: "4px", fontFamily: "Inter, sans-serif" }}>
            Connect your tools
          </h2>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.62)", marginBottom: "14px", fontFamily: "Inter, sans-serif" }}>
            {connectedCount} of {items.length} done — connect each tool so Seam can search your real content.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
            {items.map((c) => {
              const done = c.status === "connected" || c.status === "syncing";
              return (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "8px", overflow: "hidden", flexShrink: 0 }}>
                    <ConnectorIcon id={c.id as ConnectorId} size={28} />
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#FFFFFF", flex: 1, fontFamily: "Inter, sans-serif" }}>{c.name}</span>
                  {done ? (
                    <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: 600, color: "#34D399", fontFamily: "Inter, sans-serif" }}>
                      <CheckCircle size={13} strokeWidth={2.2} />
                      {c.status === "syncing" ? "Indexing…" : "Connected"}
                    </span>
                  ) : (
                    <button
                      onClick={() => onConnect(c.id as ConnectorId)}
                      disabled={connecting === c.id}
                      style={{
                        padding: "6px 14px", borderRadius: "8px",
                        background: connecting === c.id ? "rgba(79,107,245,0.5)" : "#4F6BF5",
                        color: "white", border: "none",
                        cursor: connecting === c.id ? "default" : "pointer",
                        fontSize: "12px", fontWeight: 700, fontFamily: "Inter, sans-serif",
                      }}
                    >
                      {connecting === c.id ? "Connecting…" : "Connect"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <button
            onClick={onDismiss}
            style={{ background: "none", border: "none", fontSize: "12px", color: "rgba(255,255,255,0.38)", cursor: "pointer", fontFamily: "Inter, sans-serif", textDecoration: "underline" }}
          >
            Skip for now — I&apos;ll connect later
          </button>
        </>
      )}
    </div>
  );
}

// ── Inner page ─────────────────────────────────────────────────────────────────

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
    isNew ? CONNECTOR_LIST.filter((c) => c.category === "P0").map((c) => c.id as ConnectorId) : []
  );

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

  // Load real connection status
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

      <div style={{ height: "100%", overflowY: "auto", background: "#0F1117" }}>
        <div style={{ maxWidth: "760px", padding: "28px 24px 60px" }}>

          {/* OAuth error banner */}
          {oauthError && (
            <div style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "12px 16px", borderRadius: "12px", marginBottom: "20px",
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            }}>
              <AlertCircle size={14} color="#F87171" strokeWidth={2.2} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: "13px", color: "#FCA5A5", flex: 1, fontFamily: "Inter, sans-serif" }}>
                Connection failed: {oauthError}
              </span>
              <button
                onClick={() => setOauthError(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#F87171", fontSize: "18px", lineHeight: 1, padding: 0 }}
              >
                ×
              </button>
            </div>
          )}

          {/* Page header */}
          <div style={{ marginBottom: "24px" }}>
            <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.5px", marginBottom: "4px", fontFamily: "Inter, sans-serif" }}>
              Integrations
            </h1>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.58)", fontFamily: "Inter, sans-serif" }}>
              Connect your tools. Seam searches everything you connect.
            </p>
          </div>

          {/* Stats bar */}
          <div style={{
            display: "flex", alignItems: "center", gap: "0",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "14px", padding: "14px 20px", marginBottom: "24px",
          }}>
            <div style={{ paddingRight: "20px", borderRight: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize: "20px", fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.8px", lineHeight: 1, fontFamily: "Inter, sans-serif" }}>
                {connected}/{total}
              </div>
              <div style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.45)", marginTop: "3px", fontFamily: "Inter, sans-serif" }}>connected</div>
            </div>
            <div style={{ paddingLeft: "20px", paddingRight: "20px", borderRight: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize: "20px", fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.8px", lineHeight: 1, fontFamily: "Inter, sans-serif" }}>
                {totalDocs > 0 ? totalDocs.toLocaleString() : "—"}
              </div>
              <div style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.45)", marginTop: "3px", fontFamily: "Inter, sans-serif" }}>docs indexed</div>
            </div>
            <div style={{ paddingLeft: "20px", display: "flex", alignItems: "center", gap: "6px" }}>
              {connectors.filter((c) => c.status === "connected").map((c) => (
                <div key={c.id} style={{ width: "24px", height: "24px", borderRadius: "7px", overflow: "hidden" }}>
                  <ConnectorIcon id={c.id as ConnectorId} size={24} />
                </div>
              ))}
              {connected === 0 && (
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.28)", fontFamily: "Inter, sans-serif" }}>No sources connected yet</span>
              )}
            </div>
            {connectors.some((c) => c.status === "error") && (
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px", padding: "5px 12px", borderRadius: "20px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)" }}>
                <AlertCircle size={11} color="#F87171" strokeWidth={2.2} />
                <span style={{ fontSize: "11.5px", fontWeight: 600, color: "#F87171", fontFamily: "Inter, sans-serif" }}>
                  {connectors.find((c) => c.status === "error")?.name} needs reauth
                </span>
              </div>
            )}
          </div>

          {/* Onboarding guide */}
          {pendingSources.length > 0 && (
            <OnboardingConnectGuide
              pendingSources={pendingSources}
              connectors={connectors}
              connecting={connecting}
              onConnect={handleConnect}
              onDismiss={() => setPendingSources([])}
            />
          )}

          {/* P0 connectors */}
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, background: "rgba(79,107,245,0.15)", color: "#818CF8", border: "1px solid rgba(79,107,245,0.25)", borderRadius: "5px", padding: "2px 7px", letterSpacing: "0.04em" }}>P0</span>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.72)", fontFamily: "Inter, sans-serif" }}>Core connectors</span>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.38)", fontFamily: "Inter, sans-serif" }}>— required for Knowledge Search</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {p0.map((c) => (
                <ConnectorCard
                  key={c.id}
                  connector={c}
                  onConnect={handleConnect}
                  onSync={handleSync}
                  onDisconnect={handleDisconnect}
                  connecting={connecting}
                />
              ))}
            </div>
          </div>

          {/* Read-only note */}
          <div style={{
            display: "flex", alignItems: "flex-start", gap: "10px",
            padding: "14px 16px", borderRadius: "12px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <Plug size={13} color="rgba(255,255,255,0.35)" strokeWidth={2} style={{ marginTop: "1px", flexShrink: 0 }} />
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", lineHeight: 1.6, margin: 0, fontFamily: "Inter, sans-serif" }}>
              Seam connects via OAuth — <strong style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>read-only</strong>, never writes to your tools.
              Revoke access anytime from your Notion or Slack account settings.
            </p>
          </div>

        </div>
      </div>
    </AppShell>
  );
}

// ── Page export ───────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  return (
    <Suspense fallback={null}>
      <IntegrationsInner />
    </Suspense>
  );
}
