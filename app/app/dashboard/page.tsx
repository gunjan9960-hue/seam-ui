"use client";

import {
  Calendar,
  MessageSquare,
  CheckSquare,
  FileText,
  ExternalLink,
  Video,
  AlertCircle,
  Clock,
} from "lucide-react";
import AppShell from "../../components/AppShell";

interface MeetingItem {
  time: string;
  title: string;
  participants: string[];
  type: "external" | "internal" | "1:1";
}

interface SlackItem {
  channel: string;
  preview: string;
  from: string;
  time: string;
  urgent: boolean;
}

interface JiraItem {
  key: string;
  title: string;
  status: string;
  priority: "P0" | "P1" | "P2";
  assignee: string;
  blocker: boolean;
}

interface DocItem {
  title: string;
  source: "Confluence" | "Google Docs" | "Notion";
  action: string;
  from: string;
  time: string;
}

const MEETINGS: MeetingItem[] = [
  {
    time: "10:00 AM",
    title: "Enterprise Billing Review — Q2 Retro",
    participants: ["Priya N.", "Rahul S.", "Meera D.", "+3"],
    type: "internal",
  },
  {
    time: "12:30 PM",
    title: "Zepto Customer Sync — SSO Requirements",
    participants: ["Arnav M.", "Zepto PM", "CSM Lead"],
    type: "external",
  },
  {
    time: "3:00 PM",
    title: "1:1 with Priya (Eng Lead)",
    participants: ["Priya N."],
    type: "1:1",
  },
];

const SLACK_MENTIONS: SlackItem[] = [
  {
    channel: "#product-enterprise",
    preview: "Can you confirm the SSO timeline before the Zepto call? They'll ask.",
    from: "Arnav M.",
    time: "9:12 AM",
    urgent: true,
  },
  {
    channel: "#eng-mobile",
    preview: "API rate limit fix is live in staging. Please verify against BILL-412.",
    from: "Dev Bot",
    time: "8:45 AM",
    urgent: false,
  },
  {
    channel: "#gtm-india",
    preview: "The Razorpay deck needs the onboarding flow update — do we have latest screens?",
    from: "Meera D.",
    time: "Yesterday",
    urgent: false,
  },
];

const JIRA_ITEMS: JiraItem[] = [
  {
    key: "BILL-412",
    title: "SSO Integration — Enterprise Tier",
    status: "In Progress",
    priority: "P0",
    assignee: "Rahul S.",
    blocker: false,
  },
  {
    key: "MOB-88",
    title: "iOS crash on payment confirmation screen",
    status: "Blocked",
    priority: "P0",
    assignee: "Dev Team",
    blocker: true,
  },
  {
    key: "ROAD-31",
    title: "Q3 Roadmap — Stakeholder sign-off",
    status: "In Review",
    priority: "P1",
    assignee: "You",
    blocker: false,
  },
  {
    key: "BILL-445",
    title: "Refund flow — edge case for partial payment",
    status: "Open",
    priority: "P2",
    assignee: "Unassigned",
    blocker: false,
  },
];

const DOCS_ITEMS: DocItem[] = [
  {
    title: "Q3 Enterprise Roadmap v3",
    source: "Confluence",
    action: "Tagged you",
    from: "Arnav M.",
    time: "2h ago",
  },
  {
    title: "Mobile Release Checklist — confirm scope",
    source: "Google Docs",
    action: "Comment",
    from: "Priya N.",
    time: "Yesterday",
  },
  {
    title: "Zepto Integration Brief",
    source: "Notion",
    action: "Shared",
    from: "CSM Lead",
    time: "Yesterday",
  },
];

const MEETING_TYPE: Record<string, { bg: string; color: string; label: string }> = {
  external: { bg: "#FFF3E0", color: "#C05E00", label: "External" },
  internal: { bg: "#EFF6FF", color: "#1D4ED8", label: "Team" },
  "1:1": { bg: "#F5F3FF", color: "#6D28D9", label: "1:1" },
};

const PRIORITY_STYLE: Record<string, { bg: string; color: string }> = {
  P0: { bg: "#FEF2F2", color: "#B91C1C" },
  P1: { bg: "#FFF7ED", color: "#C2410C" },
  P2: { bg: "#F0FDF4", color: "#166534" },
};

const SOURCE_COLOR: Record<string, string> = {
  Confluence: "#1868DB",
  "Google Docs": "#34A853",
  Notion: "#555866",
};

function SectionCard({
  icon: Icon,
  title,
  count,
  action,
  children,
  fullWidth,
}: {
  icon: React.ElementType;
  title: string;
  count?: number;
  action?: string;
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
        <span
          style={{
            fontSize: "12.5px",
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.1px",
          }}
        >
          {title}
        </span>
        {count !== undefined && (
          <span
            className="px-2 py-0.5 rounded-full"
            style={{
              fontSize: "10px",
              fontWeight: 700,
              background: "var(--surface)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            {count}
          </span>
        )}
        {action && (
          <button
            className="ml-auto flex items-center gap-1 transition-opacity hover:opacity-70"
            style={{
              fontSize: "11px",
              color: "var(--blue)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
            }}
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

function AskSeamBtn() {
  return (
    <button
      style={{
        fontSize: "11px",
        color: "var(--text-secondary)",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "6px",
        padding: "4px 10px",
        cursor: "pointer",
        fontFamily: "Inter, sans-serif",
        fontWeight: 500,
      }}
    >
      Ask Seam
    </button>
  );
}

export default function DashboardPage() {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <AppShell>
      <div
        className="h-full overflow-y-auto"
        style={{ background: "var(--surface)" }}
      >
        <div className="px-6 py-5" style={{ maxWidth: "900px" }}>

          {/* Header */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={11} color="var(--text-muted)" strokeWidth={2} />
              <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>
                {today}
              </p>
            </div>
            <h1
              style={{
                fontSize: "19px",
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.4px",
                marginBottom: "4px",
              }}
            >
              Good morning, Gunjan
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              {[
                { label: "3 meetings today", color: "#1D4ED8", bg: "#EFF6FF" },
                { label: "2 Slack mentions need reply", color: "#C05E00", bg: "#FFF3E0" },
                { label: "1 Jira blocker", color: "#B91C1C", bg: "#FEF2F2" },
                { label: "3 docs to review", color: "#166534", bg: "#F0FDF4" },
              ].map((item) => (
                <span
                  key={item.label}
                  className="px-2.5 py-1 rounded-full"
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    background: item.bg,
                    color: item.color,
                  }}
                >
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: "1fr 1fr" }}
          >

            {/* Meetings — full width */}
            <SectionCard
              icon={Calendar}
              title="Today's Meetings"
              count={MEETINGS.length}
              action="Calendar"
              fullWidth
            >
              <div className="flex flex-col gap-2">
                {MEETINGS.map((m, i) => {
                  const ts = MEETING_TYPE[m.type];
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div
                        style={{
                          width: "48px",
                          flexShrink: 0,
                          textAlign: "center",
                        }}
                      >
                        <p style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>
                          {m.time.split(" ")[0]}
                        </p>
                        <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                          {m.time.split(" ")[1]}
                        </p>
                      </div>
                      <div
                        style={{
                          width: "2px",
                          height: "30px",
                          background: "var(--border)",
                          borderRadius: "1px",
                          flexShrink: 0,
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "2px", lineHeight: 1.3 }}>
                          {m.title}
                        </p>
                        <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          {m.participants.join(", ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className="px-2 py-0.5 rounded-full"
                          style={{
                            fontSize: "10px",
                            fontWeight: 600,
                            background: ts.bg,
                            color: ts.color,
                          }}
                        >
                          {ts.label}
                        </span>
                        <button
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white font-semibold transition-opacity hover:opacity-90"
                          style={{
                            background: "var(--blue)",
                            fontSize: "11px",
                            border: "none",
                            cursor: "pointer",
                            fontFamily: "Inter, sans-serif",
                          }}
                        >
                          <Video size={11} strokeWidth={2} />
                          Join
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            {/* Slack */}
            <SectionCard
              icon={MessageSquare}
              title="Slack Mentions"
              count={SLACK_MENTIONS.length}
              action="Open Slack"
            >
              <div className="flex flex-col gap-2">
                {SLACK_MENTIONS.map((s, i) => (
                  <div
                    key={i}
                    className="px-3 py-2.5 rounded-lg"
                    style={{
                      background: s.urgent ? "#FFFBF5" : "var(--surface)",
                      border: `1px solid ${s.urgent ? "#FCD9AA" : "var(--border)"}`,
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        style={{ fontSize: "10px", fontWeight: 700, color: "#4A154B", letterSpacing: "0.02em" }}
                      >
                        {s.channel}
                      </span>
                      {s.urgent && (
                        <span
                          className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
                          style={{ fontSize: "9px", fontWeight: 700, background: "var(--orange)", color: "white" }}
                        >
                          <AlertCircle size={8} strokeWidth={2.5} />
                          Reply needed
                        </span>
                      )}
                      <span className="ml-auto" style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                        {s.time}
                      </span>
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "8px" }}>
                      <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>{s.from}: </strong>
                      {s.preview}
                    </p>
                    <div className="flex gap-2">
                      <button
                        className="px-2.5 py-1 rounded text-xs font-semibold text-white transition-opacity hover:opacity-90"
                        style={{ background: "var(--blue)", border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif" }}
                      >
                        Reply in Slack
                      </button>
                      <AskSeamBtn />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Jira */}
            <SectionCard
              icon={CheckSquare}
              title="Jira — Needs Attention"
              count={JIRA_ITEMS.length}
              action="Open Jira"
            >
              <div className="flex flex-col gap-2">
                {JIRA_ITEMS.map((j, i) => {
                  const ps = PRIORITY_STYLE[j.priority];
                  return (
                    <div
                      key={i}
                      className="px-3 py-2.5 rounded-lg"
                      style={{
                        background: j.blocker ? "#FFF5F5" : "var(--surface)",
                        border: `1px solid ${j.blocker ? "#FECACA" : "var(--border)"}`,
                      }}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            color: "var(--text-muted)",
                            fontFamily: "monospace",
                            letterSpacing: "0.02em",
                          }}
                        >
                          {j.key}
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded"
                          style={{ fontSize: "9px", fontWeight: 700, background: ps.bg, color: ps.color }}
                        >
                          {j.priority}
                        </span>
                        {j.blocker && (
                          <span
                            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
                            style={{ fontSize: "9px", fontWeight: 700, background: "#FEF2F2", color: "#B91C1C" }}
                          >
                            <AlertCircle size={8} strokeWidth={2.5} />
                            Blocked
                          </span>
                        )}
                        <span className="ml-auto" style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                          {j.assignee}
                        </span>
                      </div>
                      <p style={{ fontSize: "12.5px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "6px", lineHeight: 1.35 }}>
                        {j.title}
                      </p>
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-0.5 rounded-full"
                          style={{
                            fontSize: "10px",
                            fontWeight: 500,
                            background:
                              j.status === "Blocked" ? "#FEF2F2" :
                              j.status === "In Progress" ? "#EFF6FF" :
                              j.status === "In Review" ? "#F5F3FF" : "var(--surface)",
                            color:
                              j.status === "Blocked" ? "#B91C1C" :
                              j.status === "In Progress" ? "#1D4ED8" :
                              j.status === "In Review" ? "#6D28D9" : "var(--text-secondary)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          {j.status}
                        </span>
                        <button
                          className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-opacity hover:opacity-70"
                          style={{
                            fontSize: "11px",
                            color: "var(--text-secondary)",
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            cursor: "pointer",
                            fontFamily: "Inter, sans-serif",
                          }}
                        >
                          Open
                          <ExternalLink size={9} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            {/* Docs — full width */}
            <SectionCard
              icon={FileText}
              title="Docs Needing Review"
              count={DOCS_ITEMS.length}
              fullWidth
            >
              <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                {DOCS_ITEMS.map((d, i) => {
                  const color = SOURCE_COLOR[d.source];
                  return (
                    <div
                      key={i}
                      className="flex flex-col rounded-lg overflow-hidden"
                      style={{
                        border: "1px solid var(--border)",
                        boxShadow: "var(--shadow-card)",
                      }}
                    >
                      <div style={{ height: "3px", background: color }} />
                      <div className="px-3 py-3 flex flex-col gap-1.5 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            style={{
                              fontSize: "9px",
                              fontWeight: 700,
                              color,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            {d.source}
                          </span>
                          <span
                            className="ml-auto px-1.5 py-0.5 rounded-full"
                            style={{
                              fontSize: "9px",
                              fontWeight: 600,
                              background: "var(--surface)",
                              color: "var(--text-muted)",
                              border: "1px solid var(--border)",
                            }}
                          >
                            {d.action}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: "12.5px",
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            lineHeight: 1.4,
                          }}
                        >
                          {d.title}
                        </p>
                        <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          {d.from} · {d.time}
                        </p>
                        <div className="flex gap-2 mt-auto pt-2">
                          <button
                            className="flex-1 py-1.5 rounded text-xs font-semibold text-white transition-opacity hover:opacity-90"
                            style={{
                              background: "var(--blue)",
                              border: "none",
                              cursor: "pointer",
                              fontFamily: "Inter, sans-serif",
                            }}
                          >
                            Review
                          </button>
                          <AskSeamBtn />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

          </div>
        </div>
      </div>
    </AppShell>
  );
}
