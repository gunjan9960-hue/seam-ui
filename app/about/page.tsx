"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { ArrowRight, Zap, Lock, Globe } from "lucide-react";

function SeamLogo() {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
      <span style={{ fontWeight: 900, fontSize: "20px", color: "#FFFFFF", letterSpacing: "-1px", fontFamily: "Inter, sans-serif", lineHeight: 1 }}>seam</span>
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#4F6BF5", display: "inline-block", marginBottom: "3px" }} />
    </div>
  );
}

// ── Animated counter ───────────────────────────────────────────────────────────

function Counter({ target, suffix = "", duration = 1800 }: { target: number; suffix?: string; duration?: number }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setValue(Math.round(eased * target));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{value}{suffix}</span>;
}

// ── Animated search demo ───────────────────────────────────────────────────────

const DEMO_QUERIES = [
  "Why did we delay the billing feature to Q3?",
  "What are the specs for the SSO integration?",
  "What did we commit to Acme Corp in the last call?",
  "Walk me through the onboarding flow decisions",
];

const DEMO_ANSWERS = [
  {
    text: "The billing feature was delayed to Q3 because the engineering team flagged a dependency on the payments gateway migration, which was descoped in sprint 14. The decision was documented in the Q2 retro and confirmed in the all-hands on April 3rd.",
    sources: ["Q2 Planning Retro · Notion", "Sprint 14 Board · Slack #product"],
  },
  {
    text: "The SSO integration should support SAML 2.0 and OAuth 2.0, with Okta as the primary IdP. Session tokens expire after 8 hours with silent refresh. Admin provisioning via SCIM is out of scope for v1.",
    sources: ["SSO PRD v2 · Notion", "Tech Spec #eng-auth · Slack"],
  },
  {
    text: "In the June 5th call, we committed to delivering the bulk export feature by end of Q2 and a dedicated CSM within 30 days of contract signing.",
    sources: ["Acme Corp Call Notes · Notion", "#acme-corp channel · Slack"],
  },
  {
    text: "The onboarding flow went through 3 major iterations. v1 was 7 steps (dropped due to 68% drop-off). v2 is 3 steps: connect source → first search → save a thread. The core insight from user testing: show value before asking for any configuration.",
    sources: ["Onboarding Redesign · Notion", "User Testing Notes · Slack #research"],
  },
];

function SearchDemo() {
  const [queryIdx, setQueryIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [phase, setPhase] = useState<"typing" | "thinking" | "answer">("typing");
  const [dots, setDots] = useState(1);

  useEffect(() => {
    if (phase === "typing") {
      const q = DEMO_QUERIES[queryIdx];
      if (charIdx < q.length) {
        const speed = Math.random() * 20 + 35;
        const t = setTimeout(() => setCharIdx((c) => c + 1), speed);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setPhase("thinking"), 700);
        return () => clearTimeout(t);
      }
    }
    if (phase === "thinking") {
      const t = setTimeout(() => setPhase("answer"), 1400);
      return () => clearTimeout(t);
    }
    if (phase === "answer") {
      const t = setTimeout(() => {
        setQueryIdx((i) => (i + 1) % DEMO_QUERIES.length);
        setCharIdx(0);
        setPhase("typing");
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [phase, charIdx, queryIdx]);

  useEffect(() => {
    if (phase !== "thinking") return;
    const t = setInterval(() => setDots((d) => (d % 3) + 1), 400);
    return () => clearInterval(t);
  }, [phase]);

  const currentQuery = DEMO_QUERIES[queryIdx].slice(0, charIdx);
  const answer = DEMO_ANSWERS[queryIdx];

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.09)",
      borderRadius: "20px",
      padding: "28px",
      fontFamily: "Inter, sans-serif",
      maxWidth: "680px",
      margin: "0 auto",
    }}>
      {/* Search bar */}
      <div style={{
        background: "rgba(255,255,255,0.055)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "12px",
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "20px",
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.82)", flex: 1, minHeight: "20px", lineHeight: "20px" }}>
          {currentQuery}
          {phase === "typing" && (
            <span style={{ borderRight: "2px solid #4F6BF5", animation: "blink 0.9s step-end infinite", marginLeft: "1px" }}>&nbsp;</span>
          )}
        </span>
        {phase === "answer" && (
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)" }}>live via MCP</span>
        )}
      </div>

      {/* Thinking state */}
      {phase === "thinking" && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 0" }}>
          <div style={{ display: "flex", gap: "4px" }}>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{
                width: "6px", height: "6px", borderRadius: "50%", background: "#4F6BF5",
                display: "inline-block",
                opacity: dots > i ? 1 : 0.2,
                transition: "opacity 0.2s",
              }} />
            ))}
          </div>
          <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.28)" }}>Searching Notion and Slack</span>
        </div>
      )}

      {/* Answer state */}
      {phase === "answer" && (
        <div style={{ animation: "fadeInUp 0.4s ease both" }}>
          <p style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.75)", lineHeight: 1.7, marginBottom: "16px" }}>
            {answer.text}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px" }}>Sources</span>
            {answer.sources.map((s, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "8px",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "8px", padding: "7px 12px",
              }}>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#4F6BF5", background: "rgba(79,107,245,0.12)", borderRadius: "4px", padding: "1px 5px" }}>{i + 1}</span>
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>{s}</span>
                <ArrowRight size={11} style={{ color: "rgba(255,255,255,0.2)", marginLeft: "auto" }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Thread SVG ─────────────────────────────────────────────────────────────────

function ThreadSVG() {
  return (
    <svg width="120" height="60" viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ margin: "0 auto", display: "block" }}>
      <path
        d="M 0 15 Q 60 15 60 30"
        stroke="rgba(79,107,245,0.5)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        style={{ strokeDasharray: 100, strokeDashoffset: 0, animation: "drawLine 1.2s ease forwards" }}
      />
      <path
        d="M 0 45 Q 60 45 60 30"
        stroke="rgba(52,211,153,0.5)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        style={{ strokeDasharray: 100, strokeDashoffset: 0, animation: "drawLine 1.2s ease 0.3s forwards" }}
      />
      <path
        d="M 60 30 L 120 30"
        stroke="#4F6BF5"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        style={{ strokeDasharray: 60, strokeDashoffset: 60, animation: "drawRight 0.8s ease 1s forwards" }}
      />
      <circle cx="60" cy="30" r="4" fill="#4F6BF5" style={{ opacity: 0, animation: "popIn 0.3s ease 0.9s forwards" }} />
      <circle cx="118" cy="30" r="3" fill="#4F6BF5" style={{ opacity: 0, animation: "popIn 0.3s ease 1.6s forwards" }} />
    </svg>
  );
}

// ── Timeline item ──────────────────────────────────────────────────────────────

function TimelineItem({ label, status, delay }: { label: string; status: "live" | "soon" | "later"; delay: string }) {
  const colors = { live: "#34D399", soon: "#4F6BF5", later: "rgba(255,255,255,0.18)" };
  const labels = { live: "Live", soon: "Coming soon", later: "On the roadmap" };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "14px", animation: `fadeInUp 0.5s ease ${delay} both` }}>
      <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: colors[status], flexShrink: 0, boxShadow: status === "live" ? `0 0 8px ${colors[status]}` : "none" }} />
      <span style={{ fontSize: "14px", color: status === "live" ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.35)", fontWeight: status === "live" ? 600 : 400 }}>{label}</span>
      <span style={{ fontSize: "10.5px", fontWeight: 600, color: colors[status], background: `${colors[status]}15`, border: `1px solid ${colors[status]}28`, borderRadius: "12px", padding: "2px 8px", marginLeft: "auto", flexShrink: 0 }}>
        {labels[status]}
      </span>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <div style={{ background: "#0F1117", minHeight: "100vh", fontFamily: "Inter, -apple-system, sans-serif", color: "white", overflowX: "hidden" }}>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes blink {
          50% { border-color: transparent; }
        }
        @keyframes drawLine {
          from { stroke-dashoffset: 100; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes drawRight {
          from { stroke-dashoffset: 60; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes floatUp {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* Navbar */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", borderBottom: "1px solid rgba(255,255,255,0.07)", position: "sticky", top: 0, background: "rgba(15,17,23,0.92)", backdropFilter: "blur(12px)", zIndex: 50 }}>
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

      {/* Hero */}
      <section style={{ textAlign: "center", padding: "96px 24px 80px", maxWidth: "760px", margin: "0 auto", position: "relative" }}>

        {/* Ambient glow */}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "600px", height: "300px", background: "radial-gradient(ellipse, rgba(79,107,245,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ animation: "fadeInUp 0.6s ease both" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#4F6BF5", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "20px" }}>
            Why we built Seam
          </p>

          <div style={{ marginBottom: "20px", animation: "floatUp 4s ease-in-out infinite 1s" }}>
            <ThreadSVG />
          </div>

          <h1 style={{ fontSize: "clamp(36px, 6vw, 60px)", fontWeight: 900, color: "#FFFFFF", letterSpacing: "-2.5px", lineHeight: 1.05, marginBottom: "18px" }}>
            Product knowledge<br />
            <span style={{ color: "#4F6BF5" }}>lives in threads.</span>
          </h1>

          <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.45)", lineHeight: 1.7, maxWidth: "520px", margin: "0 auto 36px" }}>
            Every decision your team has made is in there somewhere — across Notion pages, Slack threads, and call notes. The problem is finding it when you need it.
          </p>

          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: "20px", padding: "7px 16px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#34D399", animation: "pulse 2s ease infinite" }} />
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#34D399" }}>Knowledge Search is live today</span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)", padding: "56px 24px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0", textAlign: "center" }}>
          {[
            { value: 66, suffix: "%", label: "of a PM's week spent on manual work — chasing context, re-reading docs", color: "#F87171" },
            { value: 25, suffix: " min", label: "lost every time a PM switches context across tools", color: "#FB923C" },
            { value: 84, suffix: "%", label: "of PMs worry they're building the wrong thing — not enough signal", color: "#A78BFA" },
          ].map((s, i) => (
            <div key={i} style={{ padding: "20px 32px", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <div style={{ fontSize: "clamp(36px, 5vw, 52px)", fontWeight: 900, color: s.color, letterSpacing: "-2px", lineHeight: 1, marginBottom: "10px" }}>
                <Counter target={s.value} suffix={s.suffix} />
              </div>
              <p style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.35)", lineHeight: 1.6, maxWidth: "200px", margin: "0 auto" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why the name */}
      <section style={{ maxWidth: "760px", margin: "0 auto", padding: "96px 24px" }}>
        <div style={{ animation: "fadeInUp 0.6s ease 0.1s both" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#34D399", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "16px" }}>Why "Seam"</p>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 900, color: "#FFFFFF", letterSpacing: "-1.5px", lineHeight: 1.15, marginBottom: "24px" }}>
            Every tool holds a fragment.<br /><span style={{ color: "#4F6BF5" }}>Seam surfaces the full picture.</span>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "32px" }}>
            {[
              { icon: "🧵", title: "Your stack is fragmented by design", body: "Every doc, message, ticket, and call note lives in a different tool. Each one holds a fragment of the decision — none of them holds the whole story." },
              { icon: "🪡", title: "Context breaks at the boundary", body: "The hardest moments in product work happen between tools — between what was decided in Slack and what got written in Notion, between the spec and the ticket." },
              { icon: "🔗", title: "Seam connects all of it", body: "One question, searched across every connected source simultaneously. One cited answer that links back to exactly where each piece of information came from." },
              { icon: "🧠", title: "Pull any thread", body: "\"Why did we descope SSO?\" \"What did we commit to Acme?\" \"What are the billing specs?\" — any PM question, answered from across your entire stack." },
            ].map((card, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "20px", animation: `fadeInUp 0.5s ease ${0.1 + i * 0.1}s both` }}>
                <div style={{ fontSize: "24px", marginBottom: "10px" }}>{card.icon}</div>
                <div style={{ fontSize: "13.5px", fontWeight: 700, color: "rgba(255,255,255,0.9)", marginBottom: "6px" }}>{card.title}</div>
                <div style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.55)", lineHeight: 1.65 }}>{card.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Search demo */}
      <section style={{ background: "rgba(79,107,245,0.04)", borderTop: "1px solid rgba(79,107,245,0.1)", borderBottom: "1px solid rgba(79,107,245,0.1)", padding: "80px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px", animation: "fadeInUp 0.6s ease both" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#4F6BF5", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>See it in action</p>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 900, color: "#FFFFFF", letterSpacing: "-1.2px", lineHeight: 1.2, marginBottom: "10px" }}>
            Ask any PM question.
          </h2>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.55)", maxWidth: "400px", margin: "0 auto" }}>
            Seam searches across every connected source simultaneously — every answer links back to its source.
          </p>
        </div>
        <SearchDemo />
        <p style={{ textAlign: "center", fontSize: "11.5px", color: "rgba(255,255,255,0.18)", marginTop: "20px" }}>
          Demo queries. Real query types from actual PM workflows.
        </p>
      </section>

      {/* How it works */}
      <section style={{ maxWidth: "760px", margin: "0 auto", padding: "96px 24px" }}>
        <div style={{ animation: "fadeInUp 0.6s ease both" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#A78BFA", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "16px" }}>How Seam works</p>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 900, color: "#FFFFFF", letterSpacing: "-1.2px", lineHeight: 1.15, marginBottom: "40px" }}>
            Connect in 2 minutes.<br />No batch indexing. Always live.
          </h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {[
            { step: "01", title: "Connect Notion or Slack", body: "Sign in with Google, then connect your workspace. No IT admin needed. Seam uses OAuth — read-only, zero write access to your tools.", color: "#4F6BF5", delay: "0s" },
            { step: "02", title: "Ask anything in natural language", body: "Type any PM question. Decision recall, spec lookup, stakeholder commitments, onboarding — Seam understands PM context.", color: "#A78BFA", delay: "0.1s" },
            { step: "03", title: "Get a cited answer in seconds", body: "Seam searches your connected sources live via MCP, generates an answer using Claude, and links every claim back to the exact source document or Slack thread.", color: "#34D399", delay: "0.2s" },
            { step: "04", title: "Follow up in the same thread", body: "Your search session stays open. Ask follow-ups, drill deeper. The full context is maintained across your conversation.", color: "#FB923C", delay: "0.3s" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: "24px", padding: "28px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none", animation: `fadeInUp 0.5s ease ${item.delay} both` }}>
              <div style={{ fontSize: "11px", fontWeight: 800, color: item.color, width: "28px", flexShrink: 0, letterSpacing: "0.04em", paddingTop: "2px" }}>{item.step}</div>
              <div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "rgba(255,255,255,0.9)", marginBottom: "6px" }}>{item.title}</div>
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.62)", lineHeight: 1.7 }}>{item.body}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust signals */}
      <section style={{ background: "rgba(52,211,153,0.03)", borderTop: "1px solid rgba(52,211,153,0.08)", borderBottom: "1px solid rgba(52,211,153,0.08)", padding: "64px 24px" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#34D399", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>Built for trust</p>
            <h2 style={{ fontSize: "clamp(22px, 3.5vw, 34px)", fontWeight: 900, color: "#FFFFFF", letterSpacing: "-1px" }}>Your data stays yours.</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            {[
              { icon: Lock, label: "Read-only access", body: "Seam never writes to your tools. Connect, search, done. We read — we never touch your data.", color: "#34D399" },
              { icon: Globe, label: "No data retention", body: "Your document content is never stored by Seam. Fetched live at query time, used, discarded. That's it.", color: "#60A5FA" },
              { icon: Zap, label: "No training on your data", body: "Anthropic's Claude processes your query in real time. Your content is never used to train any model.", color: "#A78BFA" },
            ].map(({ icon: Icon, label, body, color }, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "22px", animation: `fadeInUp 0.5s ease ${i * 0.1}s both` }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: `${color}14`, border: `1px solid ${color}25`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                  <Icon size={15} style={{ color }} strokeWidth={2} />
                </div>
                <div style={{ fontSize: "13.5px", fontWeight: 700, color: "rgba(255,255,255,0.88)", marginBottom: "6px" }}>{label}</div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", lineHeight: 1.65 }}>{body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section style={{ maxWidth: "760px", margin: "0 auto", padding: "96px 24px" }}>
        <div style={{ animation: "fadeInUp 0.6s ease both" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#FB923C", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "16px" }}>Who Seam is for</p>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 900, color: "#FFFFFF", letterSpacing: "-1.2px", lineHeight: 1.15, marginBottom: "12px" }}>
            Built for individual product managers.
          </h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.4)", lineHeight: 1.7, marginBottom: "36px", maxWidth: "540px" }}>
            Seam is for any PM who has ever spent 30 minutes hunting for a decision that was made six months ago. If your product history lives across Notion pages, Slack threads, and call notes — Seam is for you.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {[
            { label: "Works best for", value: "Solo PMs · small PM orgs" },
            { label: "Tools supported", value: "Notion + Slack" },
            { label: "Setup time", value: "Under 2 minutes" },
            { label: "Access", value: "Any PM, anywhere" },
          ].map((row, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", animation: `fadeInUp 0.4s ease ${i * 0.07}s both` }}>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>{row.label}</span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{row.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Roadmap */}
      <section style={{ background: "rgba(255,255,255,0.015)", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "80px 24px" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px", animation: "fadeInUp 0.6s ease both" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#4F6BF5", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>What&apos;s coming</p>
            <h2 style={{ fontSize: "clamp(22px, 3.5vw, 34px)", fontWeight: 900, color: "#FFFFFF", letterSpacing: "-1px" }}>
              Knowledge Search is the foundation.
            </h2>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.35)", marginTop: "10px", lineHeight: 1.6 }}>
              The full Seam vision covers the complete PM lifecycle — from finding past decisions to writing PRDs to understanding adoption.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <TimelineItem label="Knowledge Search — ask any PM question across Notion and Slack" status="live" delay="0s" />
            <TimelineItem label="PRD Creator — generate a first draft from your existing specs and decisions" status="soon" delay="0.08s" />
            <TimelineItem label="Insight Generator — surface patterns across your product history" status="soon" delay="0.16s" />
            <TimelineItem label="PM Briefing — your daily action list across Slack, Calendar, and Jira" status="later" delay="0.24s" />
            <TimelineItem label="Adoption Tracker — connect Mixpanel and see feature metrics in context" status="later" delay="0.32s" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "96px 24px", textAlign: "center" }}>
        <div style={{ animation: "fadeInUp 0.6s ease both" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#4F6BF5", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "20px" }}>Get started</p>
          <h2 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 900, color: "#FFFFFF", letterSpacing: "-2px", lineHeight: 1.05, marginBottom: "16px" }}>
            Connect your first source.<br />
            <span style={{ color: "rgba(255,255,255,0.3)" }}>Under 2 minutes.</span>
          </h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.3)", marginBottom: "36px" }}>
            Sign in with Google. Connect Notion or Slack. Ask your first question.
          </p>
          <Link href="/login" style={{
            display: "inline-flex", alignItems: "center", gap: "10px",
            padding: "14px 28px", borderRadius: "12px",
            background: "#4F6BF5", color: "white",
            textDecoration: "none", fontSize: "14px", fontWeight: 700,
            boxShadow: "0 4px 24px rgba(79,107,245,0.45)",
            letterSpacing: "-0.3px",
          }}>
            Pull your first thread
            <ArrowRight size={16} strokeWidth={2.5} />
          </Link>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.2)", marginTop: "16px" }}>
            Free · No credit card · Read-only access to your tools
          </p>
        </div>
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
