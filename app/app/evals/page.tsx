import { readFileSync } from "fs";
import { join } from "path";
import AppShell from "@/app/components/AppShell";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EvalResult = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EvalRun = Record<string, any>;

interface EvalSummary {
  avgIntentAdherence?: number;
  passIntentAdherence?: boolean;
  intentAccuracy?: number;
}

export const dynamic = "force-dynamic";

function loadRuns(): EvalRun[] {
  try {
    const raw = readFileSync(join(process.cwd(), "lib", "evals", "results.json"), "utf-8");
    return JSON.parse(raw) as EvalRun[];
  } catch {
    return [];
  }
}

function Pill({ pass, label }: { pass: boolean; label: string }) {
  return (
    <span style={{
      fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px",
      background: pass ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)",
      color: pass ? "#34D399" : "#F87171",
      border: `1px solid ${pass ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.25)"}`,
    }}>
      {pass ? "✓ " : "✗ "}{label}
    </span>
  );
}

function ScoreBar({ value, max = 5 }: { value: number; max?: number }) {
  const pct = (value / max) * 100;
  const color = value >= 4 ? "#34D399" : value >= 3 ? "#FCD34D" : "#F87171";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <div style={{ flex: 1, height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "2px" }} />
      </div>
      <span style={{ fontSize: "11px", fontWeight: 700, color, minWidth: "24px" }}>{value}</span>
    </div>
  );
}

function MetricCard({ label, value, unit, pass, target }: { label: string; value: string; unit: string; pass: boolean; target: string }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)", border: `1px solid ${pass ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}`,
      borderRadius: "12px", padding: "16px 20px",
    }}>
      <div style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>{label}</div>
      <div style={{ fontSize: "26px", fontWeight: 900, color: pass ? "#34D399" : "#F87171", letterSpacing: "-1px", lineHeight: 1 }}>
        {value}<span style={{ fontSize: "13px", fontWeight: 500, marginLeft: "3px" }}>{unit}</span>
      </div>
      <div style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.25)", marginTop: "5px" }}>target {target}</div>
    </div>
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  "A-single-intent": "Single Intent",
  "B-complex":       "Complex Multi-Part",
  "C-ambiguous":     "Ambiguous",
  "D-freshness":     "Freshness-Sensitive",
  "E-nuanced":       "Nuanced",
};

export default function EvalsPage() {
  const runs = loadRuns();

  if (runs.length === 0) {
    return (
      <AppShell>
        <div style={{ background: "#0F1117", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "32px", fontWeight: 900, color: "white", letterSpacing: "-1px", marginBottom: "8px" }}>No eval runs yet</div>
            <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.35)", marginBottom: "20px" }}>Run the eval script to populate this dashboard</div>
            <code style={{ fontSize: "12px", color: "#818CF8", background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.2)", borderRadius: "8px", padding: "8px 14px" }}>
              npx tsx scripts/run-evals.ts
            </code>
          </div>
        </div>
      </AppShell>
    );
  }

  const latest = runs[runs.length - 1];
  const { summary, results, targets, version, runAt } = latest;

  return (
    <AppShell>
      <div style={{ background: "#0F1117", minHeight: "100%", fontFamily: "Inter, sans-serif", color: "white", overflowY: "auto" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", padding: "28px 24px" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "28px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                <h1 style={{ fontSize: "22px", fontWeight: 900, letterSpacing: "-1px", margin: 0 }}>Eval Results</h1>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#818CF8", background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.2)", borderRadius: "20px", padding: "2px 8px" }}>
                  {version}
                </span>
                <Pill pass={summary.overallPass} label={summary.overallPass ? "ALL PASS" : "NEEDS WORK"} />
              </div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", marginTop: "4px" }}>
                {new Date(runAt).toLocaleString()} · {results.length} queries · {runs.length} run{runs.length !== 1 ? "s" : ""} total
              </div>
            </div>
            {runs.length > 1 && (
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>v1 → {version} comparison available</span>
            )}
          </div>

          {/* Metric cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "28px" }}>
            <MetricCard label="Answer Relevance"   value={`${summary.avgRelevance}`}        unit="/5"  pass={summary.passRelevance}        target={`≥${targets.relevance}`}         />
            <MetricCard label="Citation Accuracy"  value={`${summary.avgCitationAccuracy}`} unit="/5"  pass={summary.passCitationAccuracy}  target={`≥${targets.citationAccuracy}`}  />
            <MetricCard label="Hallucination"      value={`${summary.avgHallucination}`}    unit="/5"  pass={summary.passHallucination}     target={`≥${targets.hallucination}`}     />
            <MetricCard label="Intent Adherence"   value={`${(summary as EvalSummary).avgIntentAdherence ?? "—"}`} unit="/5" pass={(summary as EvalSummary).passIntentAdherence ?? false} target={`≥${targets.intentAdherence ?? 3.5}`} />
            <MetricCard label="Retrieval Latency"  value={`${summary.avgRetrievalMs}`}      unit="ms"  pass={summary.avgRetrievalMs <= targets.retrievalMs}  target={`<${targets.retrievalMs}ms`} />
            <MetricCard label="Generation Latency" value={`${summary.avgGenerationMs}`}     unit="ms"  pass={summary.avgGenerationMs <= targets.generationMs} target={`<${targets.generationMs}ms`} />
            <MetricCard label="Total Latency"      value={`${summary.avgTotalMs}`}          unit="ms"  pass={summary.passLatency}           target={`<${targets.totalMs}ms`}         />
            <MetricCard label="Intent Accuracy"    value={`${(summary as EvalSummary).intentAccuracy ?? "—"}`} unit="%" pass={((summary as EvalSummary).intentAccuracy ?? 0) >= 70} target="≥70%" />
          </div>

          {/* Results table */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "grid", gridTemplateColumns: "32px 1fr 90px 70px 70px 70px 70px 70px 70px", gap: "10px", fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              <span>#</span>
              <span>Query</span>
              <span>Category</span>
              <span>Relevance</span>
              <span>Citation</span>
              <span>Hallucin.</span>
              <span>Intent</span>
              <span>Total ms</span>
              <span>Flags</span>
            </div>

            {results.map((r: EvalResult) => (
              <div
                key={r.id}
                style={{
                  padding: "12px 20px",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  display: "grid",
                  gridTemplateColumns: "32px 1fr 90px 70px 70px 70px 70px 70px 70px",
                  gap: "10px",
                  alignItems: "center",
                  background: r.flags.length > 0 ? "rgba(248,113,113,0.03)" : "transparent",
                }}
              >
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>{r.id}</span>

                <div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)", lineHeight: 1.35, marginBottom: "3px" }}>
                    {r.query.length > 55 ? r.query.slice(0, 55) + "…" : r.query}
                  </div>
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "9px", color: r.intentCorrect ? "#34D399" : "#FCD34D", background: r.intentCorrect ? "rgba(52,211,153,0.08)" : "rgba(252,211,77,0.08)", border: `1px solid ${r.intentCorrect ? "rgba(52,211,153,0.2)" : "rgba(252,211,77,0.2)"}`, borderRadius: "10px", padding: "1px 6px" }}>
                      {r.intentDetected.replace(/_/g, " ")}
                    </span>
                    {r.isStale && <span style={{ fontSize: "9px", color: "#FCD34D", background: "rgba(252,211,77,0.08)", border: "1px solid rgba(252,211,77,0.2)", borderRadius: "10px", padding: "1px 6px" }}>stale</span>}
                    <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)" }}>{r.sourceCount} src</span>
                  </div>
                </div>

                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)" }}>{CATEGORY_LABELS[r.category] ?? r.category}</span>
                <ScoreBar value={r.llmScores.relevance} />
                <ScoreBar value={r.llmScores.citationAccuracy} />
                <ScoreBar value={r.llmScores.hallucination} />
                <ScoreBar value={r.llmScores.intentAdherence ?? 0} />

                <span style={{ fontSize: "11px", color: r.totalMs > targets.totalMs ? "#F87171" : "rgba(255,255,255,0.5)", fontWeight: r.totalMs > targets.totalMs ? 700 : 400 }}>
                  {r.totalMs}
                </span>

                <span style={{ fontSize: "9px", color: r.flags.length > 0 ? "#F87171" : "rgba(255,255,255,0.2)" }}>
                  {r.flags.length > 0 ? `${r.flags.length} flag${r.flags.length > 1 ? "s" : ""}` : "—"}
                </span>
              </div>
            ))}
          </div>

          {/* Edge case log */}
          {results.some((r: EvalResult) => r.flags.length > 0) && (
            <div style={{ marginTop: "20px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Edge Cases</div>
              {results.filter((r: EvalResult) => r.flags.length > 0).map((r: EvalResult) => (
                <div key={r.id} style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: "10px", padding: "12px 16px", marginBottom: "8px" }}>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", marginBottom: "5px", fontWeight: 600 }}>#{r.id} — {r.query}</div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "5px" }}>
                    {r.flags.map((f: string) => (
                      <span key={f} style={{ fontSize: "10px", color: "#F87171", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "8px", padding: "1px 7px" }}>{f}</span>
                    ))}
                  </div>
                  {r.llmScores.notes && <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>{r.llmScores.notes}</div>}
                </div>
              ))}
            </div>
          )}

          {/* V1 vs V2 comparison */}
          {runs.length > 1 && (
            <div style={{ marginTop: "20px", background: "rgba(129,140,248,0.06)", border: "1px solid rgba(129,140,248,0.15)", borderRadius: "12px", padding: "16px 20px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#818CF8", marginBottom: "12px" }}>Run Comparison</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                {["avgRelevance", "avgCitationAccuracy", "avgHallucination", "avgTotalMs"].map((key) => {
                  const v1 = runs[0].summary[key as keyof typeof runs[0]["summary"]] as number;
                  const vN = runs[runs.length - 1].summary[key as keyof typeof runs[0]["summary"]] as number;
                  const delta = key === "avgTotalMs" ? v1 - vN : (vN as number) - (v1 as number);
                  const improved = key === "avgTotalMs" ? delta > 0 : delta > 0;
                  const label = key.replace("avg", "").replace(/([A-Z])/g, " $1").trim();
                  return (
                    <div key={key}>
                      <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>{label}</div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>
                        {v1} → {vN}
                        <span style={{ fontSize: "11px", marginLeft: "4px", color: improved ? "#34D399" : "#F87171" }}>
                          {improved ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ height: "32px" }} />
        </div>
      </div>
    </AppShell>
  );
}
