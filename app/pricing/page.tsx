"use client";

import Link from "next/link";
import { Check, ArrowRight, ArrowLeft, Zap } from "lucide-react";

function SeamLogo({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-baseline" style={{ gap: "4px" }}>
      <span
        style={{
          fontWeight: 900,
          fontSize: "20px",
          color: dark ? "#1C1E26" : "#FFFFFF",
          letterSpacing: "-1px",
          fontFamily: "Inter, sans-serif",
          lineHeight: 1,
        }}
      >
        seam
      </span>
      <span
        style={{
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          background: "#4F6BF5",
          display: "inline-block",
          marginBottom: "3px",
          flexShrink: 0,
        }}
      />
    </div>
  );
}

const FREE_FEATURES = [
  "1 source (Notion or Google Docs)",
  "50 searches per month",
  "AI answer with cited sources",
  "7-day search history",
  "1 user only",
];

const PRO_FEATURES = [
  "All 6 sources (Notion, Jira, Docs, Slack, Confluence, Mixpanel)",
  "Unlimited searches",
  "PM Dashboard — morning briefing",
  "Stakeholder attribution in answers",
  "Full search history + threads",
  "Priority support",
  "14-day free trial",
];

const TEAM_FEATURES = [
  "Everything in Pro",
  "Shared workspace indexing",
  "Team search history",
  "Admin connector management",
  "Usage analytics",
  "Dedicated onboarding call",
  "SLA support",
];

const FAQ = [
  {
    q: "Is the free plan actually free forever?",
    a: "Yes — 1 source, 50 searches/month, no credit card. It's free as long as Seam exists.",
  },
  {
    q: "What happens after my 14-day trial?",
    a: "You move to the free plan automatically. No charges unless you upgrade.",
  },
  {
    q: "Can I connect Slack on the free plan?",
    a: "No. Slack, Jira, Confluence, and Mixpanel are Pro-only connectors.",
  },
  {
    q: "Is my data safe?",
    a: "Seam is read-only — we never write to your tools. Data is processed in Mumbai (India). We don't train models on your data.",
  },
  {
    q: "What's the Team plan for?",
    a: "If your whole product team wants shared indexing — same Notion workspace, same Jira project — the Team plan lets everyone search a shared index. Individual Pro users each index their own accounts.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your profile, downgrade to free instantly.",
  },
];

export default function PricingPage() {
  return (
    <div
      style={{ background: "#0F1117", minHeight: "100vh", fontFamily: "Inter, sans-serif" }}
    >
      {/* Navbar */}
      <nav
        className="flex items-center justify-between px-8 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <SeamLogo />
        <div className="flex items-center gap-5">
          <Link href="/" style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>← Home</Link>
          <Link
            href="/login"
            className="px-4 py-2 rounded-lg font-semibold transition-opacity hover:opacity-90"
            style={{ fontSize: "13px", background: "#4F6BF5", color: "white", textDecoration: "none" }}
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* Header */}
      <section className="flex flex-col items-center text-center px-6 pt-16 pb-12">
        <p
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#4F6BF5",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            marginBottom: "12px",
          }}
        >
          Pricing
        </p>
        <h1
          style={{
            fontSize: "clamp(28px, 5vw, 44px)",
            fontWeight: 900,
            color: "#FFFFFF",
            letterSpacing: "-2px",
            lineHeight: 1.1,
            marginBottom: "14px",
          }}
        >
          Simple pricing.
          <br />
          <span style={{ color: "#4F6BF5" }}>No surprises.</span>
        </h1>
        <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.45)", lineHeight: 1.6, maxWidth: "440px" }}>
          Start free. Upgrade when Seam saves you more time than it costs.
        </p>
      </section>

      {/* Pricing cards */}
      <section className="px-6 pb-16" style={{ maxWidth: "960px", margin: "0 auto" }}>
        <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1.1fr 1fr" }}>

          {/* Free */}
          <div
            className="flex flex-col rounded-2xl p-6"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="mb-5">
              <p style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: "10px", letterSpacing: "0.04em" }}>
                FREE
              </p>
              <div className="flex items-baseline gap-1 mb-1">
                <span style={{ fontSize: "36px", fontWeight: 900, color: "#FFFFFF", letterSpacing: "-2px", lineHeight: 1 }}>₹0</span>
              </div>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>Forever free · no card needed</p>
            </div>

            <Link
              href="/login"
              className="flex items-center justify-center py-3 rounded-xl font-semibold transition-all mb-6"
              style={{
                fontSize: "13.5px",
                color: "rgba(255,255,255,0.7)",
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.3)";
                (e.currentTarget as HTMLElement).style.color = "white";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)";
                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)";
              }}
            >
              Continue with Google
            </Link>

            <div className="flex flex-col gap-3">
              {FREE_FEATURES.map((f) => (
                <div key={f} className="flex items-start gap-2.5">
                  <Check size={13} color="rgba(255,255,255,0.35)" strokeWidth={2.5} style={{ marginTop: "2px", flexShrink: 0 }} />
                  <span style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pro — highlighted */}
          <div
            className="flex flex-col rounded-2xl p-6 relative"
            style={{
              background: "rgba(79,107,245,0.08)",
              border: "1.5px solid #4F6BF5",
              boxShadow: "0 0 40px rgba(79,107,245,0.15)",
            }}
          >
            {/* Most popular badge */}
            <div
              className="absolute flex items-center gap-1.5 px-3 py-1 rounded-full"
              style={{
                top: "-13px",
                left: "50%",
                transform: "translateX(-50%)",
                background: "#4F6BF5",
                fontSize: "10.5px",
                fontWeight: 700,
                color: "white",
                whiteSpace: "nowrap",
              }}
            >
              <Zap size={10} strokeWidth={2.5} />
              Most popular
            </div>

            <div className="mb-5">
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#818CF8", marginBottom: "10px", letterSpacing: "0.04em" }}>
                PRO
              </p>
              <div className="flex items-baseline gap-1 mb-1">
                <span style={{ fontSize: "36px", fontWeight: 900, color: "#FFFFFF", letterSpacing: "-2px", lineHeight: 1 }}>₹800</span>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", marginBottom: "2px" }}>/user/mo</span>
              </div>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>~₹10/day · 14-day free trial</p>
            </div>

            <Link
              href="/login"
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all mb-6"
              style={{
                fontSize: "13.5px",
                color: "white",
                textDecoration: "none",
                background: "#4F6BF5",
                boxShadow: "0 4px 16px rgba(79,107,245,0.35)",
              }}
              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.opacity = "0.9"}
              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.opacity = "1"}
            >
              Continue with Google
              <ArrowRight size={14} strokeWidth={2.5} />
            </Link>

            <div className="flex flex-col gap-3">
              {PRO_FEATURES.map((f) => (
                <div key={f} className="flex items-start gap-2.5">
                  <Check size={13} color="#4F6BF5" strokeWidth={2.5} style={{ marginTop: "2px", flexShrink: 0 }} />
                  <span style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Team */}
          <div
            className="flex flex-col rounded-2xl p-6"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="mb-5">
              <p style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: "10px", letterSpacing: "0.04em" }}>
                TEAM
              </p>
              <div className="flex items-baseline gap-1 mb-1">
                <span style={{ fontSize: "36px", fontWeight: 900, color: "#FFFFFF", letterSpacing: "-2px", lineHeight: 1 }}>₹600</span>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", marginBottom: "2px" }}>/user/mo</span>
              </div>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>Min 3 users · billed annually</p>
            </div>

            <Link
              href="mailto:hello@seam.so"
              className="flex items-center justify-center py-3 rounded-xl font-semibold transition-all mb-6"
              style={{
                fontSize: "13.5px",
                color: "rgba(255,255,255,0.7)",
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.3)";
                (e.currentTarget as HTMLElement).style.color = "white";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)";
                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)";
              }}
            >
              Talk to us
            </Link>

            <div className="flex flex-col gap-3">
              {TEAM_FEATURES.map((f) => (
                <div key={f} className="flex items-start gap-2.5">
                  <Check size={13} color="rgba(255,255,255,0.35)" strokeWidth={2.5} style={{ marginTop: "2px", flexShrink: 0 }} />
                  <span style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Comparison callout */}
        <div
          className="flex items-center justify-center gap-8 mt-8 px-6 py-4 rounded-2xl flex-wrap"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {[
            { label: "Glean", price: "₹2,500+/user/mo", note: "Global, no India focus" },
            { label: "Notion AI", price: "₹1,700/user/mo", note: "Notion-only" },
            { label: "MS Copilot", price: "₹2,100/user/mo", note: "Microsoft lock-in" },
            { label: "Seam Pro", price: "₹800/user/mo", note: "Built for India PMs", highlight: true },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: item.highlight ? "#4F6BF5" : "rgba(255,255,255,0.35)",
                  marginBottom: "3px",
                }}
              >
                {item.label}
              </p>
              <p
                style={{
                  fontSize: "15px",
                  fontWeight: 900,
                  color: item.highlight ? "#FFFFFF" : "rgba(255,255,255,0.3)",
                  letterSpacing: "-0.5px",
                  marginBottom: "2px",
                }}
              >
                {item.price}
              </p>
              <p style={{ fontSize: "10.5px", color: item.highlight ? "#818CF8" : "rgba(255,255,255,0.2)" }}>
                {item.note}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section
        className="px-6 py-16"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          maxWidth: "680px",
          margin: "0 auto",
        }}
      >
        <h2
          style={{
            fontSize: "24px",
            fontWeight: 800,
            color: "#FFFFFF",
            letterSpacing: "-0.8px",
            marginBottom: "28px",
            textAlign: "center",
          }}
        >
          FAQ
        </h2>
        <div className="flex flex-col gap-0">
          {FAQ.map((item, i) => (
            <div
              key={i}
              className="py-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p style={{ fontSize: "13.5px", fontWeight: 700, color: "#FFFFFF", marginBottom: "6px" }}>
                {item.q}
              </p>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        className="flex items-center justify-between px-8 py-5"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <SeamLogo />
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.2)" }}>© 2026 Seam. Made for PMs.</p>
      </footer>

    </div>
  );
}
