"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Grid2X2,
  Heart,
  Tag,
  Layers,
  Cpu,
  Settings,
  Search,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/apps", label: "Apps", icon: Grid2X2 },
  { href: "/favorites", label: "Favoriten", icon: Heart },
  { href: "/search", label: "Suche", icon: Search },
] as const;

const NAV_ADMIN = [
  { href: "/categories", label: "Kategorien", icon: Tag },
  { href: "/stacks", label: "Stacks", icon: Layers },
  { href: "/technologies", label: "Technologien", icon: Cpu },
  { href: "/settings", label: "Einstellungen", icon: Settings },
] as const;

type NavItem = { href: string; label: string; icon: React.ElementType };

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all",
        active
          ? "bg-primary/20 text-primary"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <Icon size={18} className="shrink-0" />
      <span className="truncate">{item.label}</span>
      {active && <ChevronRight size={14} className="ml-auto shrink-0 text-primary" />}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-60 h-screen bg-sidebar border-r border-sidebar-border shrink-0 fixed top-0 left-0 z-40">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <span className="text-xs font-bold text-white">SB</span>
          </div>
          <span className="font-semibold text-foreground tracking-tight">Stack-Base</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
          />
        ))}

        <div className="my-3 border-t border-sidebar-border" />
        <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Verwaltung
        </p>

        {NAV_ADMIN.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={pathname.startsWith(item.href)}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-sidebar-border">
        <p className="text-[11px] text-muted-foreground">v0.1.0-dev</p>
      </div>
    </aside>
  );
}
