"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";
import ConnectorIcon, { CONNECTORS, type ConnectorId } from "./ConnectorIcon";

const CONFETTI_COLORS = [
  "#4F6BF5", "#F97316", "#34A853", "#EC4899",
  "#EAB308", "#6366F1", "#0EA5E9", "#F43F5E",
];

const CONFETTI_COUNT = 36;

type ConfettiPiece = { color: string; left: number; delay: number; duration: number; size: number; shape: string };

function Confetti() {
  const [pieces] = useState<ConfettiPiece[]>(() =>
    Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      left: Math.random() * 100,
      delay: Math.random() * 1.2,
      duration: 2.4 + Math.random() * 1.5,
      size: 6 + Math.random() * 8,
      shape: i % 3 === 0 ? "50%" : "2px",
    }))
  );

  if (pieces.length === 0) return null;

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 60, overflow: "hidden" }}>
      {pieces.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: "-10px",
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: p.shape,
            background: p.color,
            animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
}

export default function Celebration({
  connectedId,
  onDismiss,
  progress,
}: {
  connectedId: ConnectorId;
  onDismiss: () => void;
  progress?: { connected: number; total: number };
}) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const meta = CONNECTORS[connectedId];

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 50);
    return () => clearTimeout(t);
  }, []);

  const goSearch = () => {
    onDismiss();
    router.push("/app");
  };

  return (
    <>
      <Confetti />

      {/* Overlay backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15,17,23,0.72)",
          backdropFilter: "blur(6px)",
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={onDismiss}
      >
        {/* Card */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#FFFFFF",
            borderRadius: "24px",
            padding: "40px 40px 32px",
            maxWidth: "420px",
            width: "calc(100% - 48px)",
            textAlign: "center",
            boxShadow: "0 24px 64px rgba(0,0,0,0.24)",
            animation: show ? "celebIn 0.5s ease forwards" : "none",
            opacity: 0,
          }}
        >
          {/* Icon */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "72px",
              height: "72px",
              borderRadius: "20px",
              overflow: "hidden",
              marginBottom: "20px",
              boxShadow: `0 8px 24px ${meta.color}40`,
            }}
          >
            <ConnectorIcon id={connectedId} size={72} />
          </div>

          {/* Heading */}
          <h2
            style={{
              fontSize: "22px",
              fontWeight: 900,
              color: "#111827",
              letterSpacing: "-0.6px",
              marginBottom: "8px",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {meta.label} connected 🎉
          </h2>

          {progress && progress.total > 0 && (
            <div style={{ marginBottom: "18px" }}>
              <p
                style={{
                  fontSize: "12.5px",
                  fontWeight: 600,
                  color: "#6B7280",
                  marginBottom: "6px",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {progress.connected} of {progress.total} sources you picked are connected
              </p>
              <div
                style={{
                  width: "100%",
                  height: "6px",
                  borderRadius: "999px",
                  background: "#F0F1F5",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: "999px",
                    background: "#4F6BF5",
                    width: `${Math.min(100, (progress.connected / progress.total) * 100)}%`,
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
            </div>
          )}

          <p
            style={{
              fontSize: "14px",
              color: "#6B7280",
              lineHeight: 1.6,
              marginBottom: "28px",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Seam is indexing your {meta.label} workspace.
            <br />
            Most content is searchable within <strong style={{ color: "#111827" }}>10–15 minutes</strong>.
          </p>

          {/* Search CTA — primary */}
          <button
            onClick={goSearch}
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
              fontSize: "15px",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
              marginBottom: "10px",
              boxShadow: "0 4px 16px rgba(79,107,245,0.35)",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.9")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
          >
            <Search size={17} strokeWidth={2.5} />
            Start searching in Seam
            <ArrowRight size={15} strokeWidth={2.5} />
          </button>

          {/* Connect more */}
          <button
            onClick={onDismiss}
            style={{
              width: "100%",
              padding: "10px",
              background: "none",
              border: "none",
              fontSize: "13px",
              color: "#9CA3AF",
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Connect more sources first
          </button>
        </div>
      </div>
    </>
  );
}
