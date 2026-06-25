"use client";

import { useState, useEffect } from "react";
import { User, Bell, Shield, LogOut, Check, ChevronRight, Loader, AlertTriangle } from "lucide-react";
import AppShell from "@/app/components/AppShell";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon size={15} style={{ color: "var(--blue)" }} />
      <span style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)" }}>{title}</span>
    </div>
  );
}

function FieldRow({
  label,
  value,
  editable = false,
  onSave,
}: {
  label: string;
  value: string;
  editable?: boolean;
  onSave?: (val: string) => Promise<void>;
}) {
  const [val, setVal] = useState(value);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!onSave) { setEditing(false); return; }
    setSaving(true);
    await onSave(val);
    setSaving(false);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: "13px", color: "var(--text-secondary)", width: "140px", flexShrink: 0 }}>{label}</span>
      <div className="flex items-center gap-2 flex-1">
        {editing ? (
          <>
            <input
              autoFocus
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              style={{ flex: 1, fontSize: "13px", color: "var(--text-primary)", border: "1px solid var(--blue)", borderRadius: "6px", padding: "4px 8px", outline: "none", background: "white" }}
            />
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ fontSize: "12px", fontWeight: 600, color: "white", background: "var(--blue)", border: "none", borderRadius: "6px", padding: "4px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
            >
              {saving ? <Loader size={11} style={{ animation: "spin 1s linear infinite" }} /> : "Save"}
            </button>
            <button
              onClick={() => { setVal(value); setEditing(false); }}
              style={{ fontSize: "12px", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: "4px 6px" }}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <span style={{ fontSize: "13px", color: "var(--text-primary)", flex: 1 }}>
              {value || <span style={{ color: "var(--text-muted)" }}>—</span>}
              {saved && <Check size={12} className="inline ml-1" style={{ color: "#10B981" }} />}
            </span>
            {editable && (
              <button
                onClick={() => { setVal(value); setEditing(true); }}
                style={{ fontSize: "11px", color: "var(--blue)", background: "none", border: "none", cursor: "pointer", padding: "2px 6px" }}
              >
                Edit
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ToggleRow({ label, description, storageKey, defaultOn = true }: { label: string; description: string; storageKey: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(() => {
    if (typeof window === "undefined") return defaultOn;
    const stored = localStorage.getItem(`seam_pref_${storageKey}`);
    return stored === null ? defaultOn : stored === "1";
  });

  const toggle = () => {
    const next = !on;
    setOn(next);
    localStorage.setItem(`seam_pref_${storageKey}`, next ? "1" : "0");
  };

  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid var(--border)" }}>
      <div>
        <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{label}</div>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{description}</div>
      </div>
      <button
        onClick={toggle}
        style={{ width: "36px", height: "20px", borderRadius: "10px", background: on ? "var(--blue)" : "#D1D5DB", border: "none", cursor: "pointer", position: "relative", flexShrink: 0, transition: "background 0.2s" }}
      >
        <span
          style={{ position: "absolute", top: "2px", left: on ? "18px" : "2px", width: "16px", height: "16px", borderRadius: "50%", background: "white", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
        />
      </button>
    </div>
  );
}

function InfoRow({ label, description }: { label: string; description: string }) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid var(--border)" }}>
      <div>
        <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{label}</div>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{description}</div>
      </div>
      <span style={{ fontSize: "11px", fontWeight: 600, color: "#10B981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "20px", padding: "2px 8px", flexShrink: 0 }}>Always on</span>
    </div>
  );
}

interface ErroredSource { provider: string; error_message: string | null; }

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState({ name: "", productName: "", company: "", stage: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [erroredSources, setErroredSources] = useState<ErroredSource[]>([]);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const email = user.email ?? "";
      const [{ data }, { data: sourcesData }] = await Promise.all([
        supabase.from("users").select("full_name,product_name,company,stage").eq("id", user.id).single(),
        supabase.from("sources").select("provider,status,error_message").eq("status", "error"),
      ]);
      setProfile({
        name: data?.full_name ?? user.user_metadata?.full_name ?? "",
        productName: data?.product_name ?? "",
        company: data?.company ?? "",
        stage: data?.stage ?? "",
        email,
      });
      setErroredSources((sourcesData ?? []) as ErroredSource[]);
      setLoading(false);
    }
    load();
  }, []);

  const saveField = (field: "full_name" | "product_name" | "company" | "stage") => async (val: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("users").update({ [field]: val }).eq("id", user.id);
    setProfile((p) => ({
      ...p,
      name: field === "full_name" ? val : p.name,
      productName: field === "product_name" ? val : p.productName,
      company: field === "company" ? val : p.company,
      stage: field === "stage" ? val : p.stage,
    }));
  };

  const handleSignOut = async () => {
    if (!window.confirm("Sign out of Seam?")) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <AppShell>
      <div className="h-full overflow-y-auto" style={{ background: "var(--surface)" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto", padding: "32px 24px" }}>

          <div className="mb-8">
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Settings</h1>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
              Manage your profile, preferences, and workspace.
            </p>
          </div>

          {/* Token expiry / source error banner */}
          {erroredSources.length > 0 && (
            <div
              className="mb-6"
              style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "12px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {erroredSources.map((s) => (
                <div key={s.provider} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <AlertTriangle size={14} style={{ color: "#EF4444", flexShrink: 0, marginTop: "1px" }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#EF4444", textTransform: "capitalize" }}>{s.provider}</span>
                    <span style={{ fontSize: "13px", color: "rgba(239,68,68,0.8)" }}> connection needs re-authorisation</span>
                    {s.error_message && (
                      <div style={{ fontSize: "11.5px", color: "rgba(239,68,68,0.55)", marginTop: "2px" }}>{s.error_message}</div>
                    )}
                  </div>
                  <button
                    onClick={() => router.push("/app/integrations")}
                    style={{ fontSize: "11.5px", fontWeight: 600, color: "#EF4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "7px", padding: "4px 10px", cursor: "pointer", flexShrink: 0, fontFamily: "Inter, sans-serif" }}
                  >
                    Reconnect
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Profile */}
          <div className="mb-6" style={{ background: "white", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px 20px 4px" }}>
            <SectionHeader icon={User} title="Profile" />
            {loading ? (
              <div style={{ padding: "20px 0", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "13px" }}>
                <Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> Loading profile…
              </div>
            ) : (
              <>
                <FieldRow label="Full name"  value={profile.name}        editable onSave={saveField("full_name")} />
                <FieldRow label="Product"    value={profile.productName} editable onSave={saveField("product_name")} />
                <FieldRow label="Company"    value={profile.company}     editable onSave={saveField("company")} />
                <FieldRow label="Email"      value={profile.email} />
              </>
            )}
            <div style={{ height: "12px" }} />
          </div>

          {/* Notifications */}
          <div className="mb-6" style={{ background: "white", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px 20px 4px" }}>
            <SectionHeader icon={Bell} title="Notifications" />
            <ToggleRow label="Weekly digest" description="Summary of new items across connected sources every Monday" storageKey="notify_weekly_digest" defaultOn />
            <ToggleRow label="Connector sync errors" description="Alert when an integration fails to sync" storageKey="notify_sync_errors" defaultOn />
            <ToggleRow label="New source suggestions" description="Notify when Seam detects a new tool in your workspace" storageKey="notify_new_sources" defaultOn={false} />
            <div style={{ height: "12px" }} />
          </div>

          {/* Privacy */}
          <div className="mb-6" style={{ background: "white", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px 20px 4px" }}>
            <SectionHeader icon={Shield} title="Data & Privacy" />
            <InfoRow label="Local-only processing" description="AI summarisation runs in India (Mumbai region), data never leaves" />
            <ToggleRow label="Save search history" description="Store recent threads so you can resume them from Dashboard" storageKey="save_history" defaultOn />
            <div
              className="flex items-center justify-between py-3 cursor-pointer"
              style={{ borderBottom: "1px solid var(--border)" }}
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.removeItem("seam_threads");
                  window.location.reload();
                }
              }}
            >
              <div>
                <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>Clear search history</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>Removes all saved threads from your browser</div>
              </div>
              <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
            </div>
            <div style={{ height: "12px" }} />
          </div>

          {/* Sign out */}
          <div style={{ background: "white", border: "1px solid #FECACA", borderRadius: "12px", padding: "16px 20px" }}>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#EF4444", fontSize: "13px", fontWeight: 600 }}
            >
              <LogOut size={15} />
              Sign out
            </button>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>
              You&apos;ll be redirected to the login page. Your data stays synced.
            </p>
          </div>

          <div style={{ height: "40px" }} />
        </div>
      </div>
    </AppShell>
  );
}
