"use client";

import Link from "next/link";
import { useEffect, useState, type ReactElement } from "react";
import { ArrowRight } from "lucide-react";
import AppShell from "@/app/components/AppShell";
import { createClient } from "@/lib/supabase/client";

// ── Auth Card (right side of hero) ────────────────────────────────────────────

const TRUST_ITEMS = [
  { icon: "🇮🇳", text: "Data stored in Mumbai — never leaves India" },
  { icon: "🔐", text: "Your data is yours. We never read, use, or train on it." },
];

function AuthCard({ loggedIn }: { loggedIn: boolean }) {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div style={{
      width: "360px",
      flexShrink: 0,
      background: "#FFFFFF",
      borderRadius: "20px",
      padding: "28px 28px 24px",
      boxShadow: "0 8px 48px rgba(0,0,0,0.35), 0 2px 12px rgba(0,0,0,0.2)",
      display: "flex",
      flexDirection: "column",
      gap: "0",
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "16px" }}>
        <span style={{ fontWeight: 900, fontSize: "22px", color: "#0F1117", letterSpacing: "-1px", fontFamily: "Inter, sans-serif", lineHeight: 1 }}>seam</span>
        <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#4F6BF5", display: "inline-block", marginBottom: "3px" }} />
      </div>

      {loggedIn ? (
        <>
          <p style={{ fontSize: "17px", fontWeight: 800, color: "#111827", letterSpacing: "-0.4px", marginBottom: "6px" }}>Welcome back</p>
          <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "20px" }}>Your workspace is ready.</p>
          <Link href="/app" style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            height: "46px", borderRadius: "12px", background: "#4F6BF5", color: "white",
            textDecoration: "none", fontSize: "14px", fontWeight: 700, fontFamily: "Inter, sans-serif",
            boxShadow: "0 4px 16px rgba(79,107,245,0.35)",
          }}>
            Go to your workspace <ArrowRight size={15} strokeWidth={2.5} />
          </Link>
        </>
      ) : (
        <>
          {/* Google button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              height: "46px", borderRadius: "12px",
              background: loading ? "#F3F4F6" : "#FFFFFF",
              border: "1.5px solid #E5E7EB",
              fontSize: "14px", fontWeight: 600, color: "#111827",
              cursor: loading ? "default" : "pointer", fontFamily: "Inter, sans-serif",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              width: "100%", marginBottom: "16px",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => { if (!loading) { (e.currentTarget as HTMLElement).style.borderColor = "#4F6BF5"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px rgba(79,107,245,0.10)"; } }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.08)"; }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
              <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            {loading ? "Redirecting…" : "Continue with Google"}
          </button>

          {/* Trust items */}
          <div style={{ display: "flex", flexDirection: "column", gap: "7px", marginBottom: "14px" }}>
            {TRUST_ITEMS.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "13px", lineHeight: 1, flexShrink: 0 }}>{item.icon}</span>
                <span style={{ fontSize: "11.5px", color: "#6B7280" }}>{item.text}</span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: "11px", color: "#9CA3AF", lineHeight: 1.55, textAlign: "center" }}>
            By signing in, you agree to our Terms and Privacy Policy.
          </p>
        </>
      )}
    </div>
  );
}

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
  { icon: "🔍", title: "Knowledge Search", body: "Ask anything. Seam searches Notion, Jira, Docs, and Slack — one cited answer, every source linked.", color: "rgba(79,107,245,0.14)", badge: "Live" },
  { icon: "📅", title: "PM Morning Briefing", body: "Meetings, @mentions, Jira blockers, and docs needing review — one screen, every CTA.", color: "rgba(52,168,83,0.12)", badge: "Live" },
  { icon: "📄", title: "PRD Creator", body: "Brief → full structured PRD in under 2 minutes. Exports to Notion or Google Docs.", color: "rgba(249,115,22,0.12)", badge: "P1" },
  { icon: "💡", title: "Insight Generator", body: "Turn interviews, support tickets, and Mixpanel data into ranked, actionable insights.", color: "rgba(234,179,8,0.12)", badge: "P1" },
  { icon: "🗺️", title: "Roadmap Builder", body: "AI-scored RICE and MoSCoW prioritisation pulled from Jira, feedback, and usage data.", color: "rgba(236,72,153,0.12)", badge: "Coming" },
  { icon: "🔐", title: "Your data, full stop.", body: "Seam never reads, stores, or trains on your content. Read-only OAuth. Data stays in India.", color: "rgba(99,102,241,0.12)", badge: null },
];

const STATS = [
  { n: "66%", label: "of PM time lost to manual work" },
  { n: "25 min", label: "lost per context switch" },
  { n: "3–6 wk", label: "of context, indexed in minutes" },
  { n: "< 2 min", label: "to connect your first tool" },
];

export default function LandingPage() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setLoggedIn(!!user));
  }, []);

  return (
    <AppShell>
    <div style={{ background: "#0F1117", minHeight: "100%", fontFamily: "Inter, -apple-system, sans-serif", color: "white", overflowY: "auto" }}>

      {/* ── Navbar ── */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "16px 40px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
          <Link href="#features" style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.5)", textDecoration: "none", fontWeight: 500 }}>Features</Link>
          {loggedIn && (
            <Link href="/app" style={{ fontSize: "13.5px", background: "#4F6BF5", color: "white", textDecoration: "none", padding: "9px 18px", borderRadius: "10px", fontWeight: 600, boxShadow: "0 2px 12px rgba(79,107,245,0.35)" }}>
              Go to app →
            </Link>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "60px 64px 48px", gap: "24px", maxWidth: "1100px", margin: "0 auto" }}>

        {/* Left */}
        <div style={{ flex: 1, maxWidth: "460px" }}>
          {/* Eyebrow pill */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 14px", borderRadius: "100px", marginBottom: "28px", background: "rgba(79,107,245,0.1)", border: "1px solid rgba(79,107,245,0.22)" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4F6BF5", flexShrink: 0 }} />
            <span style={{ fontSize: "12px", color: "#818CF8", fontWeight: 600, letterSpacing: "0.04em" }}>AI workspace for product managers · India-first</span>
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

        </div>

        {/* Right — Auth card */}
        <AuthCard loggedIn={loggedIn} />
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
            <div key={i} style={{ padding: "20px", borderRadius: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", position: "relative" }}>
              {f.badge && (
                <span style={{
                  position: "absolute",
                  top: "14px",
                  right: "14px",
                  fontSize: "9px",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  padding: "2px 7px",
                  borderRadius: "20px",
                  background: f.badge === "Live" ? "rgba(16,185,129,0.15)" : f.badge === "P1" ? "rgba(79,107,245,0.2)" : "rgba(255,255,255,0.07)",
                  color: f.badge === "Live" ? "#6EE7B7" : f.badge === "P1" ? "#93A8F8" : "rgba(255,255,255,0.35)",
                  border: f.badge === "Live" ? "1px solid rgba(16,185,129,0.3)" : f.badge === "P1" ? "1px solid rgba(79,107,245,0.3)" : "1px solid rgba(255,255,255,0.1)",
                }}>{f.badge}</span>
              )}
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: f.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", marginBottom: "12px" }}>{f.icon}</div>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "white", marginBottom: "7px", letterSpacing: "-0.2px" }}>{f.title}</h3>
              <p style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.42)", lineHeight: 1.65 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 48px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
          <span style={{ fontWeight: 900, fontSize: "16px", color: "white", letterSpacing: "-0.8px" }}>seam</span>
          <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#4F6BF5", display: "inline-block", marginBottom: "2px" }} />
        </div>
        <div style={{ display: "flex", gap: "24px" }}>
          {[["Pricing", "/pricing"], ["Roadmap", "/roadmap"], ["FAQ", "/faq"], ["Privacy", "#"], ["Terms", "#"]].map(([label, href]) => (
            <Link key={label} href={href} style={{ fontSize: "12px", color: "rgba(255,255,255,0.28)", textDecoration: "none" }}>{label}</Link>
          ))}
        </div>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.18)" }}>© 2026 Seam. Made for PMs.</p>
      </footer>
    </div>
    </AppShell>
  );
}
