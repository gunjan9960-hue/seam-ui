"use client";

import Link from "next/link";
import { useEffect, useState, type ReactElement } from "react";
import { ArrowRight } from "lucide-react";

// ── Brand icons (inline SVG, no imports needed) ───────────────────────────────

function BrandIcon({ id, size }: { id: string; size: number }) {
  const s = size;
  const icons: Record<string, ReactElement> = {
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
    "google-docs": (
      <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="10" fill="#4285F4"/>
        <rect x="12" y="10" width="24" height="30" rx="3" fill="white"/>
        <line x1="17" y1="20" x2="31" y2="20" stroke="#4285F4" strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="17" y1="25" x2="31" y2="25" stroke="#4285F4" strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="17" y1="30" x2="25" y2="30" stroke="#4285F4" strokeWidth="2.2" strokeLinecap="round"/>
      </svg>
    ),
    calendar: (
      <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="10" fill="#EA4335"/>
        <rect x="10" y="14" width="28" height="24" rx="3" fill="white"/>
        <rect x="10" y="14" width="28" height="8" rx="3" fill="#EA4335"/>
        <line x1="18" y1="10" x2="18" y2="18" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="30" y1="10" x2="30" y2="18" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <rect x="16" y="26" width="5" height="5" rx="1" fill="#EA4335"/>
        <rect x="24" y="26" width="5" height="5" rx="1" fill="#EA4335"/>
      </svg>
    ),
    confluence: (
      <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="10" fill="#1868DB"/>
        <path d="M11 33c.6-1 6-9 13-9s12.4 8 13 9" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.5"/>
        <path d="M11 15c.6 1 6 9 13 9s12.4-8 13-9" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
      </svg>
    ),
    mixpanel: (
      <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="10" fill="#7C3AED"/>
        <rect x="10" y="30" width="6" height="8" rx="2" fill="white" opacity="0.5"/>
        <rect x="21" y="22" width="6" height="16" rx="2" fill="white" opacity="0.75"/>
        <rect x="32" y="14" width="6" height="24" rx="2" fill="white"/>
      </svg>
    ),
  };
  return icons[id] ?? null;
}

// ── Thread Visualization (client-side animated) ────────────────────────────────

const ICONS = [
  { id: "notion",      cx: 55,  cy: 72,  cpx: 138, cpy: 148 },
  { id: "jira",        cx: 205, cy: 22,  cpx: 220, cpy: 122 },
  { id: "slack",       cx: 365, cy: 58,  cpx: 315, cpy: 145 },
  { id: "google-docs", cx: 438, cy: 200, cpx: 346, cpy: 218 },
  { id: "calendar",    cx: 408, cy: 360, cpx: 330, cpy: 298 },
  { id: "confluence",  cx: 240, cy: 432, cpx: 240, cpy: 338 },
  { id: "mixpanel",    cx: 72,  cy: 360, cpx: 148, cpy: 298 },
];

const CX = 240, CY = 230;

function ThreadViz() {
  const [drawn, setDrawn] = useState<number[]>([]);
  const [centerReady, setCenterReady] = useState(false);

  useEffect(() => {
    // Sequence: draw each thread 300ms apart, then reveal center
    ICONS.forEach((_, i) => {
      setTimeout(() => setDrawn((prev) => [...prev, i]), 400 + i * 280);
    });
    setTimeout(() => setCenterReady(true), 400 + ICONS.length * 280 + 200);
  }, []);

  return (
    <div style={{ position: "relative", width: "480px", height: "460px", flexShrink: 0 }}>
      {/* Thread SVG */}
      <svg viewBox="0 0 480 460" width="480" height="460"
        style={{ position: "absolute", inset: 0, overflow: "visible" }}>

        {/* Glow rings (always visible, subtle) */}
        <circle cx={CX} cy={CY} r="36"
          fill={centerReady ? "rgba(79,107,245,0.10)" : "transparent"}
          style={{ transition: "fill 0.6s ease" }} />
        <circle cx={CX} cy={CY} r="22"
          fill={centerReady ? "rgba(79,107,245,0.16)" : "transparent"}
          style={{ transition: "fill 0.6s ease 0.2s" }} />

        {/* Thread lines */}
        {ICONS.map((icon, i) => (
          <path
            key={icon.id}
            d={`M ${icon.cx} ${icon.cy} Q ${icon.cpx} ${icon.cpy} ${CX} ${CY}`}
            pathLength="1"
            stroke="rgba(79,107,245,0.5)"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
            style={{
              strokeDasharray: "1",
              strokeDashoffset: drawn.includes(i) ? "0" : "1",
              transition: drawn.includes(i) ? "stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)" : "none",
              filter: drawn.includes(i) ? "drop-shadow(0 0 3px rgba(79,107,245,0.5))" : "none",
            }}
          />
        ))}

        {/* Center seam mark */}
        <g style={{ opacity: centerReady ? 1 : 0, transition: "opacity 0.5s ease", transform: centerReady ? "scale(1)" : "scale(0.7)", transformOrigin: `${CX}px ${CY}px` }}>
          <text x={CX - 4} y={CY + 7} textAnchor="middle" fontSize="17"
            fontWeight="900" fontFamily="Inter, -apple-system, sans-serif"
            fill="white" letterSpacing="-1">seam</text>
          <circle cx={CX + 26} cy={CY - 3} r="3.5" fill="#4F6BF5" />
        </g>
      </svg>

      {/* Brand icons */}
      {ICONS.map((icon, i) => (
        <div key={icon.id}
          style={{
            position: "absolute",
            left: `${icon.cx - 24}px`,
            top: `${icon.cy - 24}px`,
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
            opacity: 1,
            transform: "scale(1)",
          }}>
          <BrandIcon id={icon.id} size={48} />
        </div>
      ))}

      {/* Tool labels */}
      {ICONS.map((icon) => {
        const isLeft = icon.cx < 160;
        const isRight = icon.cx > 320;
        return (
          <div key={`lbl-${icon.id}`}
            style={{
              position: "absolute",
              left: isLeft ? `${icon.cx + 54}px` : isRight ? `${icon.cx - 86}px` : `${icon.cx - 24}px`,
              top: `${icon.cy + 30}px`,
              fontSize: "10px",
              fontWeight: 600,
              color: "rgba(255,255,255,0.3)",
              fontFamily: "Inter, sans-serif",
              whiteSpace: "nowrap",
              textAlign: isLeft ? "left" : isRight ? "right" : "center",
            }}>
            {icon.id === "google-docs" ? "Google Docs" : icon.id.charAt(0).toUpperCase() + icon.id.slice(1)}
          </div>
        );
      })}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: "🔍", title: "One question, cited answer", body: "Ask anything. Seam searches across all connected tools and returns one answer with every source linked.", color: "rgba(79,107,245,0.14)" },
  { icon: "🧵", title: "Pull any thread", body: "\"What did we decide on SSO?\" — Seam finds the Confluence page, the Jira comment, and the Slack thread.", color: "rgba(249,115,22,0.12)" },
  { icon: "📅", title: "PM Morning Briefing", body: "Meetings, @mentions, Jira blockers, and docs needing review — one screen, every CTA.", color: "rgba(52,168,83,0.12)" },
  { icon: "⚡", title: "Webhook-first, always fresh", body: "Answers reflect what happened this morning — not last week's index.", color: "rgba(234,179,8,0.12)" },
  { icon: "🎯", title: "Built for B2B SaaS PMs", body: "Understands Jira ticket types, CFR clients, and stakeholder attribution.", color: "rgba(236,72,153,0.12)" },
  { icon: "🔒", title: "Read-only. Always.", body: "OAuth read permissions only. Seam never writes to your tools.", color: "rgba(99,102,241,0.12)" },
];

const STATS = [
  { n: "66%", label: "of PM time lost to manual work" },
  { n: "25 min", label: "lost per context switch" },
  { n: "3–6 wk", label: "onboarding time just for context" },
  { n: "₹800", label: "per user/month — all sources" },
];

export default function LandingPage() {
  return (
    <div style={{ background: "#0F1117", minHeight: "100vh", fontFamily: "Inter, -apple-system, sans-serif", color: "white" }}>

      {/* ── Navbar ── */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 48px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
          <span style={{ fontWeight: 900, fontSize: "22px", color: "white", letterSpacing: "-1.2px", fontFamily: "Inter, sans-serif" }}>seam</span>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4F6BF5", display: "inline-block", marginBottom: "3px" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
          <Link href="#features" style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.5)", textDecoration: "none", fontWeight: 500 }}>Features</Link>
          <Link href="/pricing" style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.5)", textDecoration: "none", fontWeight: 500 }}>Pricing</Link>
          <Link href="/roadmap" style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.5)", textDecoration: "none", fontWeight: 500 }}>Roadmap</Link>
          <Link href="/login" style={{ fontSize: "13.5px", background: "#4F6BF5", color: "white", textDecoration: "none", padding: "9px 18px", borderRadius: "10px", fontWeight: 600, boxShadow: "0 2px 12px rgba(79,107,245,0.35)" }}>
            Get early access →
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "60px 64px 48px", gap: "24px", maxWidth: "1100px", margin: "0 auto" }}>

        {/* Left */}
        <div style={{ flex: 1, maxWidth: "460px" }}>
          {/* Eyebrow pill */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 14px", borderRadius: "100px", marginBottom: "28px", background: "rgba(79,107,245,0.1)", border: "1px solid rgba(79,107,245,0.22)" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4F6BF5", flexShrink: 0 }} />
            <span style={{ fontSize: "12px", color: "#818CF8", fontWeight: 600, letterSpacing: "0.04em" }}>AI search for B2B SaaS PMs · India</span>
          </div>

          {/* Logo headline */}
          <h1 style={{ fontWeight: 900, letterSpacing: "-3px", lineHeight: 1.0, color: "white", margin: "0 0 8px", fontSize: "clamp(52px, 7vw, 76px)" }}>
            seam<span style={{ color: "#4F6BF5" }}>.</span>
          </h1>

          <p style={{ fontSize: "clamp(18px, 2.5vw, 24px)", fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "20px" }}>
            Pull any thread.
          </p>

          <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.52)", lineHeight: 1.75, marginBottom: "36px", maxWidth: "400px" }}>
            The AI search layer for PMs — cited answers across every tool your team uses.
            <strong style={{ color: "rgba(255,255,255,0.8)" }}> One question. All your tools. One answer.</strong>
          </p>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/login"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "14px 22px", borderRadius: "12px", background: "#4F6BF5", color: "white", textDecoration: "none", fontSize: "14.5px", fontWeight: 700, boxShadow: "0 4px 24px rgba(79,107,245,0.4)" }}>
              Start free — no credit card
              <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
            <Link href="/app"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "14px 18px", borderRadius: "12px", color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "14px", fontWeight: 500, border: "1px solid rgba(255,255,255,0.13)" }}>
              See demo →
            </Link>
          </div>

          <p style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.22)", marginTop: "14px" }}>
            14-day free trial · ₹800/user/month · Cancel anytime
          </p>
        </div>

        {/* Right — Animated thread viz */}
        <ThreadViz />
      </section>

      {/* ── Stats bar ── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", maxWidth: "860px", margin: "0 auto", padding: "28px 48px" }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ textAlign: "center", padding: "0 20px", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
              <p style={{ fontSize: "28px", fontWeight: 900, color: "#4F6BF5", letterSpacing: "-1px", lineHeight: 1, marginBottom: "5px" }}>{s.n}</p>
              <p style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.36)", lineHeight: 1.5 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <section style={{ padding: "72px 48px", maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "#4F6BF5", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "10px" }}>How it works</p>
        <h2 style={{ fontSize: "clamp(22px,4vw,34px)", fontWeight: 900, color: "white", letterSpacing: "-1.2px", marginBottom: "48px" }}>
          Stitch your tools together in 3 steps
        </h2>
        <div style={{ display: "flex", gap: "0" }}>
          {[
            { icon: "🔗", step: "01", title: "Connect your tools", body: "Link Notion, Jira, Google Docs, Slack via OAuth. Read-only. 2 minutes." },
            { icon: "🧠", step: "02", title: "Seam stitches the seam", body: "Seam reads, chunks, and indexes your workspace. Searchable in 15 min." },
            { icon: "✦",  step: "03", title: "Pull any thread",     body: "Type a question. Get a cited answer with every source card linked." },
          ].map((item, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "0 20px", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "16px", background: "rgba(79,107,245,0.1)", border: "1px solid rgba(79,107,245,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", marginBottom: "14px" }}>{item.icon}</div>
              <p style={{ fontSize: "10px", fontWeight: 800, color: "#4F6BF5", letterSpacing: "0.12em", marginBottom: "6px" }}>STEP {item.step}</p>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "white", marginBottom: "8px" }}>{item.title}</h3>
              <p style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.4)", lineHeight: 1.65 }}>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ padding: "0 48px 72px", maxWidth: "1000px", margin: "0 auto" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "#4F6BF5", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "8px", textAlign: "center" }}>Why Seam</p>
        <h2 style={{ fontSize: "clamp(22px,4vw,32px)", fontWeight: 900, color: "white", letterSpacing: "-1px", marginBottom: "32px", textAlign: "center" }}>
          Stop searching. <span style={{ color: "#4F6BF5" }}>Start deciding.</span>
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ padding: "20px", borderRadius: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: f.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", marginBottom: "12px" }}>{f.icon}</div>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "white", marginBottom: "7px", letterSpacing: "-0.2px" }}>{f.title}</h3>
              <p style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.42)", lineHeight: 1.65 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ textAlign: "center", padding: "64px 48px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(79,107,245,0.04)" }}>
        <div style={{ display: "inline-flex", alignItems: "baseline", gap: "3px", marginBottom: "16px" }}>
          <span style={{ fontWeight: 900, fontSize: "22px", color: "white", letterSpacing: "-1.2px" }}>seam</span>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4F6BF5", display: "inline-block", marginBottom: "3px" }} />
        </div>
        <h2 style={{ fontSize: "clamp(28px,5vw,44px)", fontWeight: 900, color: "white", letterSpacing: "-2px", lineHeight: 1.1, margin: "0 0 12px" }}>
          Stop switching tabs.<br /><span style={{ color: "#4F6BF5" }}>Pull the thread.</span>
        </h2>
        <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.38)", marginBottom: "28px" }}>14-day free trial · ₹800/user/month · Cancel anytime</p>
        <Link href="/login"
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "15px 28px", borderRadius: "14px", background: "#4F6BF5", color: "white", textDecoration: "none", fontSize: "15px", fontWeight: 700, boxShadow: "0 4px 32px rgba(79,107,245,0.45)" }}>
          Get early access — it's free
          <ArrowRight size={17} strokeWidth={2.5} />
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 48px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
          <span style={{ fontWeight: 900, fontSize: "16px", color: "white", letterSpacing: "-0.8px" }}>seam</span>
          <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#4F6BF5", display: "inline-block", marginBottom: "2px" }} />
        </div>
        <div style={{ display: "flex", gap: "24px" }}>
          {[["Pricing", "/pricing"], ["Roadmap", "/roadmap"], ["Privacy", "#"], ["Terms", "#"]].map(([label, href]) => (
            <Link key={label} href={href} style={{ fontSize: "12px", color: "rgba(255,255,255,0.28)", textDecoration: "none" }}>{label}</Link>
          ))}
        </div>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.18)" }}>© 2026 Seam. Made for PMs.</p>
      </footer>
    </div>
  );
}
