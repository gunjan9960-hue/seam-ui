"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowUpRight } from "lucide-react";
import AppShell from "../components/AppShell";

const SUGGESTED_QUERIES = [
  "What did we decide on SSO in Q3 and why was it descoped?",
  "Who are the key stakeholders for the enterprise billing migration?",
  "What are all open blockers on the mobile release?",
  "What did Rahul comment on the API rate limiting spec?",
];

const SOURCES = [
  { label: "Notion", dot: "#555866" },
  { label: "Jira", dot: "#0052CC" },
  { label: "Google Docs", dot: "#34A853" },
  { label: "Slack", dot: "#4A154B" },
  { label: "Confluence", dot: "#1868DB" },
  { label: "Calendar", dot: "#EA4335" },
];

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const router = useRouter();

  const handleSearch = (q?: string) => {
    const searchQuery = q ?? query;
    if (!searchQuery.trim()) return;
    router.push(`/app/search?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <AppShell>
      <div
        className="flex flex-col items-center justify-center h-full"
        style={{ background: "#FFFFFF" }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-baseline gap-1 mb-2">
            <span
              style={{
                fontWeight: 800,
                fontSize: "34px",
                color: "var(--navy)",
                letterSpacing: "-1.5px",
                lineHeight: 1,
                fontFamily: "Inter, sans-serif",
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
                marginBottom: "5px",
                flexShrink: 0,
              }}
            />
          </div>
          <p
            style={{
              fontSize: "12.5px",
              color: "var(--text-muted)",
              letterSpacing: "0.08em",
              fontWeight: 500,
              textTransform: "uppercase",
            }}
          >
            Pull any thread.
          </p>
        </div>

        {/* Search bar */}
        <div className="w-full flex flex-col" style={{ maxWidth: "600px", padding: "0 24px" }}>
          <div
            className="flex items-center gap-3 px-4"
            style={{
              background: "#FFFFFF",
              border: `1.5px solid ${focused ? "var(--blue)" : "var(--border)"}`,
              borderRadius: "12px",
              height: "52px",
              boxShadow: focused
                ? "0 0 0 3px rgba(79,107,245,0.12), var(--shadow-search)"
                : "var(--shadow-card)",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
          >
            <Search size={15} color="var(--text-muted)" strokeWidth={2} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Ask anything about your product..."
              className="flex-1 outline-none bg-transparent"
              style={{
                fontSize: "14px",
                color: "var(--text-primary)",
                fontFamily: "Inter, sans-serif",
                fontWeight: 400,
              }}
              autoFocus
            />
            {query && (
              <button
                onClick={() => handleSearch()}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-white font-semibold transition-opacity hover:opacity-90"
                style={{
                  background: "var(--blue)",
                  fontSize: "12px",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Search
                <kbd
                  style={{
                    fontSize: "10px",
                    opacity: 0.7,
                    fontFamily: "inherit",
                    letterSpacing: 0,
                  }}
                >
                  ↵
                </kbd>
              </button>
            )}
          </div>

          {/* Source pills */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span
              style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}
            >
              Searching across:
            </span>
            {SOURCES.map((s) => (
              <span
                key={s.label}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                  fontWeight: 500,
                }}
              >
                <span
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: s.dot,
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* Suggested queries */}
        <div className="mt-8 w-full" style={{ maxWidth: "600px", padding: "0 24px" }}>
          <p
            className="mb-3"
            style={{
              fontSize: "10.5px",
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.09em",
            }}
          >
            Suggested
          </p>
          <div className="flex flex-col gap-1.5">
            {SUGGESTED_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => handleSearch(q)}
                className="flex items-center gap-3 text-left px-4 py-3 rounded-lg transition-all group"
                style={{
                  background: "var(--surface)",
                  border: "1px solid transparent",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  boxShadow: "none",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "#FFFFFF";
                  el.style.borderColor = "var(--border)";
                  el.style.boxShadow = "var(--shadow-card)";
                  el.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "var(--surface)";
                  el.style.borderColor = "transparent";
                  el.style.boxShadow = "none";
                  el.style.color = "var(--text-secondary)";
                }}
              >
                <ArrowUpRight
                  size={13}
                  color="var(--blue)"
                  strokeWidth={2}
                  style={{ flexShrink: 0 }}
                />
                <span style={{ lineHeight: 1.4 }}>{q}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
