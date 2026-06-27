"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Plug, Settings, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { icon: Search, label: "Search", href: "/app" },
];

const BOTTOM_NAV = [
  { icon: Plug, label: "Integrations", href: "/app/integrations" },
  { icon: Settings, label: "Settings", href: "/app/settings" },
];

function NavItem({
  icon: Icon,
  label,
  href,
  badge,
  isActive,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      title={label}
      className="relative flex items-center justify-center w-full rounded-lg transition-all"
      style={{
        height: "40px",
        background: isActive ? "rgba(79,107,245,0.18)" : "transparent",
        color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.4)",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
          (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.75)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)";
        }
      }}
    >
      <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
      {badge !== undefined && (
        <span
          className="absolute flex items-center justify-center rounded-full text-white"
          style={{
            top: "6px",
            right: "6px",
            fontSize: "8.5px",
            fontWeight: 700,
            width: "13px",
            height: "13px",
            background: "#F97316",
            lineHeight: 1,
          }}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [avatar, setAvatar] = useState<{ initials: string; photoUrl?: string }>({ initials: "" });
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const name: string = user.user_metadata?.full_name ?? user.email ?? "";
      const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
      const photoUrl = user.user_metadata?.avatar_url;
      setAvatar({ initials, photoUrl });
    });
  }, []);

  const isActive = (href: string) => {
    if (href === "/app") return pathname === "/app" || pathname.startsWith("/app/search");
    return pathname.startsWith(href);
  };

  return (
    <aside
      className="flex flex-col items-center py-3 gap-0.5"
      style={{
        width: "56px",
        minWidth: "56px",
        background: "linear-gradient(180deg, #1C1E26 0%, #1A1C24 100%)",
        height: "100%",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center justify-center mb-4 mt-1"
        style={{ width: "32px", height: "32px" }}
      >
        <span
          style={{
            fontWeight: 900,
            fontSize: "18px",
            color: "#4F6BF5",
            letterSpacing: "-1px",
            fontFamily: "Inter, sans-serif",
            lineHeight: 1,
          }}
        >
          S
        </span>
      </Link>

      {/* Top nav */}
      <div className="flex flex-col items-center gap-0.5 w-full px-2">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.label} {...item} isActive={isActive(item.href)} />
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom nav */}
      <div className="flex flex-col items-center gap-0.5 w-full px-2 pb-2">
        {BOTTOM_NAV.map((item) => (
          <NavItem key={item.label} {...item} isActive={isActive(item.href)} />
        ))}

        {/* Divider */}
        <div style={{ width: "24px", height: "1px", background: "rgba(255,255,255,0.08)", margin: "6px 0" }} />

        {/* Avatar / sign-out menu */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            title="Account"
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "block" }}
          >
            {avatar.photoUrl ? (
              <img
                src={avatar.photoUrl}
                alt="avatar"
                referrerPolicy="no-referrer"
                style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: "28px",
                  height: "28px",
                  background: "#4F6BF5",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "white",
                  letterSpacing: "0.02em",
                }}
              >
                {avatar.initials || "?"}
              </div>
            )}
          </button>

          {menuOpen && (
            <>
              <div
                onClick={() => setMenuOpen(false)}
                style={{ position: "fixed", inset: 0, zIndex: 40 }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "0",
                  left: "44px",
                  background: "#FFFFFF",
                  borderRadius: "10px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
                  padding: "6px",
                  zIndex: 50,
                  minWidth: "120px",
                }}
              >
                <Link
                  href="/app/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 w-full rounded-lg transition-colors"
                  style={{
                    padding: "8px 10px",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    color: "#374151",
                    textDecoration: "none",
                    fontFamily: "Inter, sans-serif",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#F3F4F6")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "none")}
                >
                  <Settings size={14} strokeWidth={2} />
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 w-full rounded-lg transition-colors"
                  style={{
                    padding: "8px 10px",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    color: "#B91C1C",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "Inter, sans-serif",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#FEF2F2")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "none")}
                >
                  <LogOut size={14} strokeWidth={2} />
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
