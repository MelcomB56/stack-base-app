"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Grid2X2, Heart, Tag, Layers, Cpu,
  Settings, Search, ChevronLeft, ChevronRight, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/apps",      label: "Apps",       icon: Grid2X2 },
  { href: "/favorites", label: "Favoriten",  icon: Heart },
  { href: "/search",    label: "Suche",      icon: Search },
] as const;

const NAV_ADMIN = [
  { href: "/categories",   label: "Kategorien",   icon: Tag },
  { href: "/stacks",       label: "Stacks",        icon: Layers },
  { href: "/technologies", label: "Technologien",  icon: Cpu },
  { href: "/settings",     label: "Einstellungen", icon: Settings },
] as const;

type NavItem = { href: string; label: string; icon: React.ElementType };

function StackBaseLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-3 px-1 min-w-0">
      {/* Hexagon-Icon */}
      <div className="shrink-0 w-8 h-8 relative flex items-center justify-center">
        <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none">
          <path
            d="M16 2L28 9V23L16 30L4 23V9L16 2Z"
            fill="oklch(0.530 0.220 262)"
            stroke="oklch(0.735 0.155 194)"
            strokeWidth="1"
          />
          <path
            d="M16 7L23 11V19L16 23L9 19V11L16 7Z"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1"
          />
          <text x="16" y="20" textAnchor="middle" fontSize="9" fontWeight="700" fill="white" fontFamily="sans-serif">SB</text>
        </svg>
      </div>
      {!collapsed && (
        <div className="overflow-hidden">
          <p className="text-sm font-bold tracking-wide text-foreground whitespace-nowrap">STACK·BASE</p>
          <p style={{ fontSize: "8px", letterSpacing: ".15em", textTransform: "uppercase", color: "#7A8BA6", marginTop: "1px", whiteSpace: "nowrap" }}>One Platform. All Ops.</p>
        </div>
      )}
    </Link>
  );
}

function NavLink({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
        collapsed && "justify-center px-2",
        active
          ? "bg-primary/15 text-primary border border-primary/20"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border border-transparent"
      )}
    >
      <Icon size={17} className="shrink-0" />
      {!collapsed && <span className="truncate flex-1">{item.label}</span>}
      {!collapsed && active && (
        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-w", collapsed ? "60px" : "220px");
  }, [collapsed]);

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border shrink-0 fixed top-0 left-0 z-40 transition-all duration-200",
        collapsed ? "w-[60px]" : "w-[220px]"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center border-b border-sidebar-border py-4", collapsed ? "px-2 justify-center" : "px-4")}>
        <StackBaseLogo collapsed={collapsed} />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
            collapsed={collapsed}
          />
        ))}

        <div className="my-2.5 border-t border-sidebar-border" />

        {!collapsed && (
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Verwaltung
          </p>
        )}

        {NAV_ADMIN.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={pathname.startsWith(item.href)}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-2 py-2 space-y-1">
        {/* User */}
        {session?.user && !collapsed && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg">
            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-primary">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-foreground">{session.user.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{session.user.email}</p>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title={collapsed ? "Abmelden" : undefined}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-destructive transition-all",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut size={15} className="shrink-0" />
          {!collapsed && <span>Abmelden</span>}
        </button>

        {/* Collapse-Toggle */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all",
            collapsed && "justify-center px-2"
          )}
        >
          {collapsed ? <ChevronRight size={14} /> : (
            <>
              <ChevronLeft size={14} />
              <span>Minimieren</span>
            </>
          )}
        </button>

        {!collapsed && (
          <p className="px-3 text-[10px] text-muted-foreground">v0.2.0-dev</p>
        )}
      </div>
    </aside>
  );
}
