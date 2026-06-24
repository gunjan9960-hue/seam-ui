"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

function SeamLogo() {
  return (
    <div className="flex items-baseline" style={{ gap: "4px" }}>
      <span
        style={{
          fontWeight: 900,
          fontSize: "28px",
          color: "var(--navy)",
          letterSpacing: "-1.5px",
          fontFamily: "Inter, sans-serif",
          lineHeight: 1,
        }}
      >
        seam
      </span>
      <span
        style={{
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          background: "var(--blue)",
          display: "inline-block",
          marginBottom: "4px",
          flexShrink: 0,
        }}
      />
    </div>
  );
}

const TRUST_ITEMS = [
  { icon: "🔒", text: "Read-only OAuth — Seam never writes to your tools" },
  { icon: "🇮🇳", text: "Data processed in India (Mumbai region)" },
  { icon: "✦", text: "No sharing. Your workspace is private to you." },
];

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--surface)", fontFamily: "Inter, sans-serif" }}
    >
      <div className="w-full" style={{ maxWidth: "420px", padding: "24px" }}>

        {/* Back link */}
        <Link
          href="/"
          className="flex items-center gap-1.5 mb-8 transition-opacity hover:opacity-70"
          style={{ fontSize: "12.5px", color: "var(--text-muted)", textDecoration: "none", fontWeight: 500 }}
        >
          <ArrowLeft size={13} strokeWidth={2} />
          Back to home
        </Link>

        {/* Card */}
        <div
          className="flex flex-col items-center rounded-2xl px-8 py-8"
          style={{
            background: "#FFFFFF",
            boxShadow: "0 8px 40px rgba(0,0,0,0.09), 0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          {/* Logo */}
          <div className="mb-1">
            <SeamLogo />
          </div>
          <p
            style={{
              fontSize: "11.5px",
              color: "var(--text-muted)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight: 500,
              marginBottom: "28px",
            }}
          >
            Pull any thread.
          </p>

          <h1
            style={{
              fontSize: "19px",
              fontWeight: 800,
              color: "var(--text-primary)",
              letterSpacing: "-0.5px",
              textAlign: "center",
              marginBottom: "6px",
            }}
          >
            Welcome back
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "var(--text-secondary)",
              textAlign: "center",
              marginBottom: "28px",
              lineHeight: 1.5,
            }}
          >
            Sign in to search across your entire
            <br />
            product workspace.
          </p>

          {/* Google button */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 rounded-xl font-semibold transition-all"
            style={{
              height: "48px",
              background: "#FFFFFF",
              border: "1.5px solid var(--border)",
              fontSize: "14px",
              color: "var(--text-primary)",
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
              boxShadow: "var(--shadow-card)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#4F6BF5";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px rgba(79,107,245,0.10)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
              (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-card)";
            }}
          >
            {/* Google G logo */}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
              <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <p
            style={{
              fontSize: "11.5px",
              color: "var(--text-muted)",
              textAlign: "center",
              marginTop: "16px",
              lineHeight: 1.6,
            }}
          >
            By signing in, you agree to our Terms and Privacy Policy.
          </p>
        </div>

        {/* Trust signals */}
        <div className="flex flex-col gap-2.5 mt-5">
          {TRUST_ITEMS.map((item, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <span style={{ fontSize: "14px", lineHeight: 1 }}>{item.icon}</span>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{item.text}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
