"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, LayoutDashboard, Plug, Settings } from "lucide-react";

const NAV_ITEMS = [
  { icon: Search, label: "Search", href: "/app" },
  { icon: LayoutDashboard, label: "Dashboard", href: "/app/dashboard", badge: 3 },
];

const BOTTOM_NAV = [
  { icon: Plug, label: "Integrations", href: "/app/integrations", badge: 1 },
  { icon: Settings, label: "Settings", href: "#" },
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
        href="/app"
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
          <NavItem key={item.label} {...item} badge={item.badge} isActive={isActive(item.href)} />
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom nav */}
      <div className="flex flex-col items-center gap-0.5 w-full px-2 pb-2">
        {BOTTOM_NAV.map((item) => (
          <NavItem key={item.label} {...item} badge={item.badge} isActive={isActive(item.href)} />
        ))}

        {/* Divider */}
        <div style={{ width: "24px", height: "1px", background: "rgba(255,255,255,0.08)", margin: "6px 0" }} />

        {/* Avatar */}
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
          GM
        </div>
      </div>
    </aside>
  );
}
