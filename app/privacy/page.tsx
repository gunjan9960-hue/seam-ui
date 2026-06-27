"use client";

import Link from "next/link";
import { Lock, Server, Eye, Trash2, Mail } from "lucide-react";

function SeamLogo() {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
      <span style={{ fontWeight: 900, fontSize: "20px", color: "#FFFFFF", letterSpacing: "-1px", fontFamily: "Inter, sans-serif", lineHeight: 1 }}>seam</span>
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#4F6BF5", display: "inline-block", marginBottom: "3px" }} />
    </div>
  );
}

const PRINCIPLES = [
  {
    icon: Eye,
    color: "#34D399",
    title: "Read-only access",
    body: "Seam never writes to your tools. We request read-only OAuth scopes — we can see your Notion pages and Slack messages to answer your questions, but we cannot create, edit, or delete anything in your workspace.",
  },
  {
    icon: Server,
    color: "#60A5FA",
    title: "No data retention",
    body: "Seam does not store your document content. Your Notion pages and Slack messages are fetched live at query time, used to generate an answer, and discarded. Nothing is cached on Seam's servers.",
  },
  {
    icon: Lock,
    color: "#A78BFA",
    title: "No training on your data",
    body: "Seam uses the Anthropic Claude API to generate answers. Anthropic does not train on API inputs by default. Your content is processed ephemerally — we send only the relevant context for your query, not your entire workspace.",
  },
  {
    icon: Trash2,
    color: "#FB923C",
    title: "You control your data",
    body: "Your search history is stored locally in your browser. You can clear it any time from Settings. Disconnecting a source from Integrations immediately removes Seam's access to that workspace.",
  },
];

export default function PrivacyPage() {
  return (
    <div style={{ background: "#0F1117", minHeight: "100vh", fontFamily: "Inter, -apple-system, sans-serif", color: "white" }}>

      {/* Navbar */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <SeamLogo />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <Link href="/faq" style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", textDecoration: "none", fontWeight: 500 }}>FAQ</Link>
          <Link href="/login" style={{ fontSize: "13px", background: "#4F6BF5", color: "white", textDecoration: "none", padding: "8px 16px", borderRadius: "9px", fontWeight: 600, boxShadow: "0 2px 12px rgba(79,107,245,0.35)" }}>
            Get started free
          </Link>
        </div>
      </nav>

      {/* Header */}
      <section style={{ textAlign: "center", padding: "72px 24px 56px", maxWidth: "640px", margin: "0 auto" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <Lock size={20} style={{ color: "#34D399" }} strokeWidth={2} />
        </div>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "#34D399", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>Privacy</p>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 900, color: "#FFFFFF", letterSpacing: "-2px", lineHeight: 1.1, marginBottom: "16px" }}>
          Your data is yours.<br /><span style={{ color: "#34D399" }}>Always.</span>
        </h1>
        <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.38)", lineHeight: 1.7, maxWidth: "460px", margin: "0 auto" }}>
          Seam is a read-only search tool. We access your Notion and Slack workspaces to answer your questions — and nothing else.
        </p>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.22)", marginTop: "16px" }}>
          Last updated: June 2026
        </p>
      </section>

      {/* Core principles */}
      <section style={{ maxWidth: "720px", margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {PRINCIPLES.map(({ icon: Icon, color, title, body }, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `${color}14`, border: `1px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={15} style={{ color }} strokeWidth={2} />
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "rgba(255,255,255,0.9)", marginBottom: "8px" }}>{title}</div>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>{body}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* What we store */}
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "28px", marginTop: "12px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>What Seam stores</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {[
              ["Your email and name", "From Google OAuth sign-in", true],
              ["OAuth tokens for connected sources", "Stored encrypted; used to read your workspace", true],
              ["Search history", "Stored locally in your browser only — never on our servers", true],
              ["Your document content", "Never stored — fetched live from Notion/Slack at query time and discarded after the response", false],
              ["AI training data", "Never — your queries are never used to train any model", false],
            ].map(([item, note, stored], i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "12px 0", borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: stored ? "#4F6BF5" : "#EF4444", background: stored ? "rgba(79,107,245,0.1)" : "rgba(239,68,68,0.08)", border: `1px solid ${stored ? "rgba(79,107,245,0.2)" : "rgba(239,68,68,0.15)"}`, borderRadius: "12px", padding: "2px 8px", flexShrink: 0, marginTop: "1px" }}>
                  {stored ? "Stored" : "Not stored"}
                </span>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 500, color: "rgba(255,255,255,0.75)" }}>{item}</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", marginTop: "2px" }}>{note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)", padding: "56px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.5px", marginBottom: "10px" }}>Questions about your data?</h2>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.35)", marginBottom: "24px" }}>We reply to every email.</p>
        <a href="mailto:hello@seam.so" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 24px", borderRadius: "11px", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "13.5px", fontWeight: 600, border: "1px solid rgba(255,255,255,0.12)", fontFamily: "Inter, sans-serif" }}>
          <Mail size={14} />
          hello@seam.so
        </a>
      </section>

      {/* Footer */}
      <footer style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 40px", borderTop: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap", gap: "12px" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <SeamLogo />
        </Link>
        <div style={{ display: "flex", gap: "24px" }}>
          {[["About", "/about"], ["Privacy", "/privacy"], ["FAQ", "/faq"]].map(([label, href]) => (
            <Link key={label} href={href} style={{ fontSize: "12px", color: "rgba(255,255,255,0.28)", textDecoration: "none" }}>{label}</Link>
          ))}
        </div>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.18)" }}>© 2026 Seam. Made for PMs.</p>
      </footer>
    </div>
  );
}
