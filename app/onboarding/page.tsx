"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import ConnectorIcon, { CONNECTORS, type ConnectorId } from "../components/ConnectorIcon";
import { createClient } from "@/lib/supabase/client";

interface FormData {
  name: string;
  productName: string;
  company: string;
  stage: string;
  sources: ConnectorId[];
}

const STAGES = [
  { id: "early", label: "Early Stage", sub: "Seed · <50 people" },
  { id: "growth", label: "Growth", sub: "Series A–C · 50–500" },
  { id: "scale", label: "Scale", sub: "Series D+ · 500+" },
];

const SOURCE_IDS: ConnectorId[] = ["notion", "jira", "slack"];

const TOTAL_STEPS = 3;

const STEP_META = [
  { title: "Tell us about you", subtitle: "Seam uses this to personalise your search results" },
  { title: "Which tools does your team use?", subtitle: "Select every tool your team actively uses" },
  { title: "You're all set 🎉", subtitle: "Here's your Seam workspace" },
];

// ── Seam Transition Overlay ───────────────────────────────────────────────────

// 6 icons arranged in a perfect hexagon around center (250, 250), radius 180
const TRANSITION_ICONS = [
  { id: "notion",      cx: 250, cy: 70  },   // top
  { id: "jira",        cx: 406, cy: 160 },   // top-right
  { id: "slack",       cx: 406, cy: 340 },   // bottom-right
  { id: "google-docs", cx: 250, cy: 430 },   // bottom
  { id: "confluence",  cx: 94,  cy: 160 },   // top-left
];
const TCX = 250, TCY = 250;

function SeamTransition() {
  const [drawn, setDrawn] = useState<number[]>([]);
  const [centerPulse, setCenterPulse] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Draw each line 220ms apart
    TRANSITION_ICONS.forEach((_, i) => {
      setTimeout(() => setDrawn((prev) => [...prev, i]), 180 + i * 220);
    });
    // Pulse seam center after all lines
    setTimeout(() => setCenterPulse(true), 180 + 6 * 220 + 80);
    // Begin fade-out
    setTimeout(() => setFadeOut(true), 1650);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#0F1117",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: fadeOut ? 0 : 1,
        transition: fadeOut ? "opacity 0.45s ease" : "none",
      }}
    >
      {/* Stars / grain overlay */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(79,107,245,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Animation container */}
      <div style={{ position: "relative", width: "500px", height: "500px" }}>

        {/* SVG: rings + thread lines */}
        <svg viewBox="0 0 500 500" width="500" height="500"
          style={{ position: "absolute", inset: 0, overflow: "visible" }}>

          {/* Outer ambient ring */}
          <circle cx={TCX} cy={TCY} r={centerPulse ? 70 : 0}
            fill="none" stroke="rgba(79,107,245,0.10)" strokeWidth="1"
            style={{ transition: "r 0.8s ease" }} />
          {/* Inner glow */}
          <circle cx={TCX} cy={TCY} r={centerPulse ? 44 : 0}
            fill="rgba(79,107,245,0.08)"
            style={{ transition: "r 0.6s ease 0.1s" }} />

          {/* Thread lines: center → each tool */}
          {TRANSITION_ICONS.map((icon, i) => (
            <path
              key={icon.id}
              d={`M ${TCX} ${TCY} L ${icon.cx} ${icon.cy}`}
              pathLength="1"
              fill="none"
              stroke="#4F6BF5"
              strokeWidth="1.5"
              strokeLinecap="round"
              style={{
                strokeDasharray: "1",
                strokeDashoffset: drawn.includes(i) ? "0" : "1",
                transition: drawn.includes(i)
                  ? "stroke-dashoffset 0.55s cubic-bezier(0.4,0,0.2,1)"
                  : "none",
                opacity: drawn.includes(i) ? 0.7 : 0,
                filter: drawn.includes(i) ? "drop-shadow(0 0 4px rgba(79,107,245,0.6))" : "none",
              }}
            />
          ))}
        </svg>

        {/* Center seam wordmark */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            alignItems: "baseline",
            gap: "4px",
            zIndex: 2,
          }}
        >
          <span style={{ fontWeight: 900, fontSize: "30px", color: "white", letterSpacing: "-1.5px", fontFamily: "Inter, sans-serif", lineHeight: 1 }}>
            seam
          </span>
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "#4F6BF5",
              display: "inline-block",
              marginBottom: "5px",
              boxShadow: centerPulse ? "0 0 10px rgba(79,107,245,0.9)" : "none",
              transition: "box-shadow 0.4s ease",
            }}
          />
        </div>

        {/* Tool icons */}
        {TRANSITION_ICONS.map((icon, i) => (
          <div
            key={icon.id}
            style={{
              position: "absolute",
              left: `${icon.cx - 24}px`,
              top: `${icon.cy - 24}px`,
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: drawn.includes(i)
                ? "0 4px 20px rgba(79,107,245,0.30), 0 2px 8px rgba(0,0,0,0.4)"
                : "0 2px 8px rgba(0,0,0,0.3)",
              opacity: drawn.includes(i) ? 1 : 0.35,
              transform: drawn.includes(i) ? "scale(1)" : "scale(0.82)",
              transition: "all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)",
              zIndex: 2,
            }}
          >
            <ConnectorIcon id={icon.id as ConnectorId} size={48} />
          </div>
        ))}
      </div>

      {/* Label */}
      <p
        style={{
          fontSize: "13.5px",
          color: "rgba(255,255,255,0.35)",
          marginTop: "12px",
          fontFamily: "Inter, sans-serif",
          fontWeight: 500,
          letterSpacing: "0.02em",
        }}
      >
        Stitching your workspace together
        <span style={{ animation: "ellipsisDots 1.2s steps(4, end) infinite" }}>…</span>
      </p>
    </div>
  );
}

// ── Step 1: Name + Product + Stage ───────────────────────────────────────────

function StepAbout({ data, onChange }: { data: FormData; onChange: (p: Partial<FormData>) => void }) {
  const inputStyle = {
    height: "44px",
    padding: "0 14px",
    fontSize: "14px",
    color: "var(--text-primary)",
    background: "#FFFFFF",
    border: "1.5px solid var(--border)",
    borderRadius: "10px",
    fontFamily: "Inter, sans-serif",
    boxShadow: "var(--shadow-card)",
    outline: "none",
    width: "100%",
    transition: "border-color 0.15s, box-shadow 0.15s",
  };

  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "var(--blue)";
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79,107,245,0.10)";
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "var(--border)";
    e.currentTarget.style.boxShadow = "var(--shadow-card)";
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "6px" }}>
          Your name
        </label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Gunjan Maheshwari"
          autoFocus
          style={inputStyle}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div>
          <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "6px" }}>
            Product name
          </label>
          <input
            type="text"
            value={data.productName}
            onChange={(e) => onChange({ productName: e.target.value })}
            placeholder="e.g. Seam, Billing Suite"
            style={inputStyle}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </div>
        <div>
          <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "6px" }}>
            Company
          </label>
          <input
            type="text"
            value={data.company}
            onChange={(e) => onChange({ company: e.target.value })}
            placeholder="e.g. Freshworks, Zepto"
            style={inputStyle}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </div>
      </div>

      <div>
        <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "8px" }}>
          Company stage
        </label>
        <div className="flex gap-2.5">
          {STAGES.map((s) => {
            const sel = data.stage === s.id;
            return (
              <button key={s.id} onClick={() => onChange({ stage: s.id })}
                className="flex-1 flex flex-col items-center py-3.5 px-3 rounded-xl transition-all"
                style={{
                  background: sel ? "rgba(79,107,245,0.06)" : "#FFFFFF",
                  border: `1.5px solid ${sel ? "var(--blue)" : "var(--border)"}`,
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  boxShadow: sel ? "0 0 0 3px rgba(79,107,245,0.08)" : "var(--shadow-card)",
                }}>
                {sel && (
                  <div className="flex items-center justify-center rounded-full mb-2"
                    style={{ width: "16px", height: "16px", background: "var(--blue)" }}>
                    <Check size={9} color="white" strokeWidth={3} />
                  </div>
                )}
                <p style={{ fontSize: "13px", fontWeight: 600, color: sel ? "var(--blue)" : "var(--text-primary)", marginBottom: "3px" }}>
                  {s.label}
                </p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{s.sub}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl"
        style={{ background: "rgba(79,107,245,0.04)", border: "1px solid rgba(79,107,245,0.12)" }}>
        <Sparkles size={12} color="var(--blue)" strokeWidth={2} style={{ marginTop: "2px", flexShrink: 0 }} />
        <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Seam uses your product name to <strong style={{ color: "var(--text-primary)" }}>personalise search results</strong> — surfacing the most relevant tickets, specs, and discussions for your context.
        </p>
      </div>
    </div>
  );
}

// ── Step 2: Source selection ──────────────────────────────────────────────────

function StepSources({ data, onChange }: { data: FormData; onChange: (p: Partial<FormData>) => void }) {
  const toggle = (id: ConnectorId) => {
    const next = data.sources.includes(id)
      ? data.sources.filter((s) => s !== id)
      : [...data.sources, id];
    onChange({ sources: next });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {SOURCE_IDS.map((id) => {
          const meta = CONNECTORS[id];
          const sel = data.sources.includes(id);
          return (
            <button key={id} onClick={() => toggle(id)}
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all"
              style={{
                background: sel ? "rgba(79,107,245,0.05)" : "#FFFFFF",
                border: `1.5px solid ${sel ? "var(--blue)" : "var(--border)"}`,
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
                boxShadow: sel ? "0 0 0 3px rgba(79,107,245,0.08)" : "var(--shadow-card)",
              }}>
              <div className="rounded-lg overflow-hidden flex-shrink-0" style={{ width: "32px", height: "32px" }}>
                <ConnectorIcon id={id} size={32} />
              </div>
              <span style={{ fontSize: "13px", fontWeight: 600, color: sel ? "var(--blue)" : "var(--text-primary)", flex: 1 }}>
                {meta.label}
              </span>
              <div className="flex items-center justify-center rounded-full flex-shrink-0"
                style={{ width: "18px", height: "18px", background: sel ? "var(--blue)" : "transparent", border: `1.5px solid ${sel ? "var(--blue)" : "var(--border)"}`, transition: "all 0.15s" }}>
                {sel && <Check size={10} color="white" strokeWidth={3} />}
              </div>
            </button>
          );
        })}
      </div>

      {data.sources.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
          style={{ background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
          <Check size={12} color="#065F46" strokeWidth={2.5} />
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#065F46" }}>
            {data.sources.length} source{data.sources.length > 1 ? "s" : ""} selected
          </span>
          <span style={{ fontSize: "12px", color: "#065F46", opacity: 0.7 }}>
            — Seam will start indexing after you connect via OAuth
          </span>
        </div>
      )}
    </div>
  );
}

// ── Step 3: Summary ───────────────────────────────────────────────────────────

function StepDone({ data }: { data: FormData }) {
  const firstName = data.name.split(" ")[0] || "there";
  const initials = data.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const stage = STAGES.find((s) => s.id === data.stage);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center rounded-full flex-shrink-0"
            style={{ width: "38px", height: "38px", background: "var(--blue)", fontSize: "13px", fontWeight: 700, color: "white" }}>
            {initials || "?"}
          </div>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>
              {data.name || "—"}
            </p>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              {data.company || "—"}
              {stage ? ` · ${stage.label}` : ""}
            </p>
          </div>
        </div>
        {data.productName && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: "#FFFFFF", border: "1px solid var(--border)" }}>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>Product:</span>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{data.productName}</span>
          </div>
        )}
      </div>

      {data.sources.length > 0 && (
        <div>
          <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
            Sources to connect
          </p>
          <div className="flex flex-wrap gap-2">
            {data.sources.map((id) => {
              const meta = CONNECTORS[id];
              return (
                <div key={id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-full"
                  style={{ background: meta.bg, border: `1px solid ${meta.color}22` }}>
                  <div className="rounded overflow-hidden" style={{ width: "16px", height: "16px" }}>
                    <ConnectorIcon id={id} size={16} />
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: 500, color: meta.color }}>{meta.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl"
        style={{ background: "rgba(79,107,245,0.04)", border: "1px solid rgba(79,107,245,0.12)" }}>
        <Sparkles size={12} color="var(--blue)" strokeWidth={2} style={{ marginTop: "2px", flexShrink: 0 }} />
        <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.65 }}>
          Next: connect each source via OAuth. Seam is <strong style={{ color: "var(--text-primary)" }}>read-only</strong> — it never writes to your tools. Most workspaces are fully searchable in <strong style={{ color: "var(--text-primary)" }}>10–15 minutes</strong>.
        </p>
      </div>
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: "3px",
          borderRadius: "2px",
          background: i <= step ? "var(--blue)" : "var(--border)",
          width: i === step ? "28px" : i < step ? "20px" : "12px",
          opacity: i > step ? 0.4 : 1,
          transition: "all 0.3s ease",
        }} />
      ))}
      <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "4px" }}>
        {step + 1} / {total}
      </span>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [data, setData] = useState<FormData>({
    name: "",
    productName: "",
    company: "",
    stage: "",
    sources: [],
  });

  const onChange = (patch: Partial<FormData>) =>
    setData((prev) => ({ ...prev, ...patch }));

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;

      // Redirect existing users — they already have a workspace
      const { data: existing } = await supabase
        .from("users")
        .select("workspace_id")
        .eq("id", user.id)
        .maybeSingle();
      if (existing?.workspace_id) {
        router.replace("/app");
        return;
      }

      const fullName: string = user.user_metadata?.full_name ?? "";
      if (fullName) setData((prev) => ({ ...prev, name: prev.name || fullName }));
    });
  }, [router]);

  const canAdvance = () => {
    if (step === 0) return data.name.trim().length > 0 && data.productName.trim().length > 0;
    if (step === 1) return data.sources.length > 0;
    return true;
  };

  const saveProfile = async () => {
    const res = await fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        productName: data.productName,
        company: data.company,
        stage: data.stage,
      }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Unknown error" }));
      console.error("Failed to complete onboarding:", error);
    }
  };

  const next = async () => {
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    } else {
      setTransitioning(true);
      await saveProfile();
      sessionStorage.setItem("seam_pending_sources", JSON.stringify(data.sources));
      setTimeout(() => {
        router.push("/app/integrations?from=onboarding");
      }, 2100);
    }
  };

  const firstName = data.name.split(" ")[0];
  const meta = STEP_META[step];

  return (
    <>
      {transitioning && <SeamTransition />}

      <div className="flex items-center justify-center min-h-screen" style={{ background: "var(--surface)", fontFamily: "Inter, sans-serif" }}>
        <div className="w-full flex flex-col" style={{ maxWidth: "540px", background: "#FFFFFF", borderRadius: "20px", boxShadow: "0 8px 40px rgba(0,0,0,0.10)", overflow: "hidden", margin: "24px" }}>

          {/* Top bar */}
          <div className="flex items-center justify-between px-6 pt-5">
            <div className="flex items-baseline" style={{ gap: "4px" }}>
              <span style={{ fontWeight: 900, fontSize: "20px", color: "var(--navy)", letterSpacing: "-1px", fontFamily: "Inter, sans-serif", lineHeight: 1 }}>
                seam
              </span>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--blue)", display: "inline-block", marginBottom: "3px" }} />
            </div>
            <ProgressBar step={step} total={TOTAL_STEPS} />
          </div>

          {/* Header */}
          <div className="px-6 pt-5 pb-4">
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px", lineHeight: 1.2, marginBottom: "4px" }}>
              {step === 0 && "Welcome to Seam"}
              {step === 1 && (firstName ? `Nice to meet you, ${firstName}.` : "Your tools")}
              {step === 2 && (firstName ? `${firstName}, you're all set.` : "You're all set.")}
            </h2>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{meta.subtitle}</p>
          </div>

          <div style={{ height: "1px", background: "var(--border)", margin: "0 24px" }} />

          {/* Content */}
          <div className="px-6 py-5">
            {step === 0 && <StepAbout data={data} onChange={onChange} />}
            {step === 1 && <StepSources data={data} onChange={onChange} />}
            {step === 2 && <StepDone data={data} />}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4"
            style={{ borderTop: "1px solid var(--border)", background: "var(--surface)" }}>
            <button onClick={() => setStep((s) => s - 1)} disabled={step === 0}
              className="flex items-center gap-1.5"
              style={{ fontSize: "13px", fontWeight: 500, color: step === 0 ? "transparent" : "var(--text-secondary)", background: "none", border: "none", cursor: step === 0 ? "default" : "pointer", fontFamily: "Inter, sans-serif" }}>
              <ArrowLeft size={14} strokeWidth={2} />
              Back
            </button>

            <button onClick={next} disabled={!canAdvance()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all"
              style={{
                fontSize: "13.5px",
                background: canAdvance() ? "var(--blue)" : "var(--border)",
                color: canAdvance() ? "#FFFFFF" : "var(--text-muted)",
                border: "none",
                cursor: canAdvance() ? "pointer" : "not-allowed",
                fontFamily: "Inter, sans-serif",
                boxShadow: canAdvance() ? "0 2px 8px rgba(79,107,245,0.30)" : "none",
              }}>
              {step === TOTAL_STEPS - 1 ? "Connect sources" : "Continue"}
              <ArrowRight size={14} strokeWidth={2} />
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
