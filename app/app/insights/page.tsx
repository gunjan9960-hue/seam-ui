"use client";

import { Lightbulb, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import AppShell from "@/app/components/AppShell";

const PLANNED_FEATURES = [
  { icon: "🔍", title: "Research clustering", body: "Paste user interview transcripts or support tickets — Seam groups them into themes by frequency and impact." },
  { icon: "📊", title: "Ticket signal analysis", body: "Pull all Jira tickets tagged as bugs or customer requests; surface the top 5 patterns PMs should act on." },
  { icon: "💡", title: "Ranked insight cards", body: "Each insight shows evidence count, affected users, and a recommended action — sorted by PM-relevance score." },
  { icon: "🔗", title: "Feeds PRD Creator", body: "One click sends a ranked insight directly into a new PRD brief — closing the loop from discovery to definition." },
];

export default function InsightsPage() {
  const router = useRouter();

  return (
    <AppShell>
      <div className="h-full overflow-y-auto" style={{ background: "var(--surface)" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto", padding: "48px 24px" }}>

          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "rgba(79,107,245,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Lightbulb size={20} style={{ color: "var(--blue)" }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.4px" }}>
                  Insight Generator
                </h1>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "var(--blue)",
                    background: "rgba(79,107,245,0.08)",
                    border: "1px solid rgba(79,107,245,0.2)",
                    borderRadius: "20px",
                    padding: "3px 9px",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  P1 · Next
                </span>
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0, marginTop: "3px" }}>
                Interviews + tickets → ranked, actionable insights
              </p>
            </div>
          </div>

          {/* Coming soon banner */}
          <div
            style={{
              background: "rgba(79,107,245,0.04)",
              border: "1px solid rgba(79,107,245,0.15)",
              borderRadius: "14px",
              padding: "28px 24px",
              textAlign: "center",
              margin: "28px 0",
            }}
          >
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>💡</div>
            <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px", letterSpacing: "-0.3px" }}>
              Building now
            </h2>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.65, margin: 0 }}>
              The Insight Generator module is in active development as a P1 feature.<br />
              It will surface patterns from your user research, tickets, and feedback — ranked by frequency and PM impact.
            </p>
          </div>

          {/* Planned features */}
          <div style={{ marginBottom: "28px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
              What&apos;s coming
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {PLANNED_FEATURES.map((f) => (
                <div
                  key={f.title}
                  style={{
                    background: "white",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    padding: "14px",
                  }}
                >
                  <div style={{ fontSize: "20px", marginBottom: "8px" }}>{f.icon}</div>
                  <div style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>{f.title}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.6 }}>{f.body}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/app")}
              className="flex items-center gap-2"
              style={{
                padding: "10px 18px",
                borderRadius: "10px",
                background: "var(--blue)",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              Try Knowledge Search
              <ArrowRight size={13} />
            </button>
          </div>

        </div>
      </div>
    </AppShell>
  );
}
