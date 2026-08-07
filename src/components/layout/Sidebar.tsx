"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { LogOut, ChevronLeft, ChevronRight } from "lucide-react";

// Exakte SVG-Icons aus dem Artifact
const Icons = {
  dashboard: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  docs: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  apps: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
    </svg>
  ),
  heart: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/>
    </svg>
  ),
  search: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  categories: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
      <path d="M16 3v4M8 3v4M12 12v.01"/>
    </svg>
  ),
  stacks: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
  technologies: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/>
      <rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>
    </svg>
  ),
  settings: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 20a8 8 0 100-16 8 8 0 000 16z"/>
      <path d="M12 14a2 2 0 100-4 2 2 0 000 4z"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
    </svg>
  ),
};

const Icons_tag = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);

const Icons_graph = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="5" cy="12" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="19" cy="19" r="2"/>
    <line x1="7" y1="11.5" x2="17" y2="6.5"/><line x1="7" y1="12.5" x2="17" y2="17.5"/>
  </svg>
);

const Icons_users = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
  </svg>
);

const Icons_shield = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="M9 12l2 2 4-4"/>
  </svg>
);

const Icons_target = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
  </svg>
);

const Icons_announce = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M3 11l19-9-9 19-2-8-8-2z"/>
  </svg>
);

type NavItem = { href: string; label: string; icon: React.ReactNode; permission?: string };

const NAV: NavItem[] = [
  { href: "/dashboard",   label: "Dashboard",    icon: Icons.dashboard,     permission: "apps.read" },
  { href: "/apps",        label: "Apps",         icon: Icons.apps,          permission: "apps.read" },
  { href: "/favorites",   label: "Favoriten",    icon: Icons.heart },
  { href: "/search",      label: "Suche",        icon: Icons.search,        permission: "apps.read" },
  { href: "/docs",        label: "Docs",         icon: Icons.docs,          permission: "platform_docs.read" },
];

const NAV_ADMIN: NavItem[] = [
  { href: "/dependency-graph", label: "Dep. Graph",    icon: Icons_graph,       permission: "apps.read" },
  { href: "/categories",       label: "Kategorien",    icon: Icons.categories,  permission: "categories.read" },
  { href: "/stacks",           label: "Stacks",        icon: Icons.stacks,      permission: "stacks.read" },
  { href: "/technologies",     label: "Technologien",  icon: Icons.technologies, permission: "technologies.read" },
  { href: "/tags",             label: "Tags",          icon: Icons_tag,         permission: "tags.read" },
  { href: "/targets",          label: "Targets",       icon: Icons_target,      permission: "targets.read" },
  { href: "/announcements",    label: "Ankündigungen", icon: Icons_announce,    permission: "announcements.read" },
  { href: "/settings",         label: "Einstellungen", icon: Icons.settings,    permission: "settings.read" },
];

const NAV_ADMIN_RESTRICTED: NavItem[] = [
  { href: "/admin/users", label: "Nutzer", icon: Icons_users, permission: "users.read" },
  { href: "/admin/roles", label: "Rollen", icon: Icons_shield, permission: "roles.read" },
];

function hasPermission(allowedPerms: string[], permission?: string) {
  if (!permission) return true;
  return allowedPerms.includes("*") || allowedPerms.includes(permission);
}

function LogoFull() {
  return (
    <img
      src="/logo.png"
      alt="Stack-Base"
      style={{ height: 32, width: "auto", display: "block" }}
    />
  );
}

function LogoIcon() {
  return (
    <img
      src="/logo-icon.png"
      alt="Stack-Base"
      style={{ width: 32, height: 32, display: "block", objectFit: "contain" }}
    />
  );
}

function NavLink({ item, collapsed, active }: { item: NavItem; collapsed: boolean; active: boolean }) {
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: collapsed ? 0 : 10,
        padding: collapsed ? "9px 10px" : "9px 12px",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 500,
        textDecoration: "none",
        border: "1px solid",
        borderColor: active ? "rgba(37,99,232,0.2)" : "transparent",
        background: active ? "rgba(37,99,232,0.15)" : "transparent",
        color: active ? "#2563E8" : "#8FA3BE",
        transition: "all 150ms",
        justifyContent: collapsed ? "center" : "flex-start",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "#1A2640";
          e.currentTarget.style.color = "#EDF2F7";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "#8FA3BE";
        }
      }}
    >
      <span style={{ width: 16, height: 16, flexShrink: 0, opacity: active ? 1 : 0.7, display: "flex" }}>
        {item.icon}
      </span>
      {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
      {!collapsed && active && (
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563E8" }} />
      )}
    </Link>
  );
}

export function Sidebar({ allowedPerms }: { allowedPerms: string[] }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-w", collapsed ? "60px" : "220px");
  }, [collapsed]);

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  const visibleNav = NAV.filter((item) => hasPermission(allowedPerms, item.permission));
  const visibleAdmin = [...NAV_ADMIN, ...NAV_ADMIN_RESTRICTED].filter((item) =>
    hasPermission(allowedPerms, item.permission)
  );

  return (
    <aside
      style={{
        width: collapsed ? 60 : 220,
        minHeight: "100vh",
        background: "#060D18",
        borderRight: "1px solid #1E3050",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        transition: "width 200ms",
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div style={{
        padding: 16,
        borderBottom: "1px solid #1E3050",
        display: "flex",
        alignItems: "center",
        gap: 12,
        justifyContent: collapsed ? "center" : "flex-start",
      }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          {collapsed ? <LogoIcon /> : <LogoFull />}
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
        {visibleNav.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return <NavLink key={item.href} item={item} collapsed={collapsed} active={active} />;
        })}

        {visibleAdmin.length > 0 && (
          <>
            <div style={{ borderTop: "1px solid #1E3050", margin: "10px 4px" }} />
            {!collapsed && (
              <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".15em", textTransform: "uppercase", color: "#7A8BA6", padding: "0 12px 4px" }}>
                Verwaltung
              </p>
            )}
            {visibleAdmin.map((item) => {
              const active = pathname.startsWith(item.href);
              return <NavLink key={item.href} item={item} collapsed={collapsed} active={active} />;
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #1E3050", padding: 8 }}>
        {session?.user && (
          <Link
            href="/profile"
            title={collapsed ? "Mein Profil" : undefined}
            style={{
              display: "flex", alignItems: "center",
              gap: collapsed ? 0 : 10,
              padding: collapsed ? "7px 10px" : "8px 10px",
              margin: "0 0 4px",
              borderRadius: 8, textDecoration: "none",
              justifyContent: collapsed ? "center" : "flex-start",
              border: "1px solid #1E3050",
              background: "#0D1829",
              transition: "border-color 150ms, background 150ms",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(37,99,232,0.4)";
              (e.currentTarget as HTMLElement).style.background = "#1A2640";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#1E3050";
              (e.currentTarget as HTMLElement).style.background = "#0D1829";
            }}
          >
            <div style={{
              width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
              background: "rgba(37,99,232,0.15)", border: "1px solid rgba(37,99,232,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, color: "#2563E8",
              overflow: "hidden",
            }}>
              {session.user.image
                ? <img src={session.user.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : initials
              }
            </div>
            {!collapsed && (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#EDF2F7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>
                    {session.user.name}
                  </p>
                  <p style={{ fontSize: 10, color: "#7A8BA6", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>
                    {session.user.email}
                  </p>
                </div>
                <ChevronRight size={12} style={{ color: "#4A5B6F", flexShrink: 0 }} />
              </>
            )}
          </Link>
        )}

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title={collapsed ? "Abmelden" : undefined}
          style={{
            width: "100%", display: "flex", alignItems: "center",
            gap: collapsed ? 0 : 10,
            padding: collapsed ? "8px 0" : "8px 12px",
            justifyContent: collapsed ? "center" : "flex-start",
            borderRadius: 8, fontSize: 12, color: "#7A8BA6",
            background: "none", border: "none", cursor: "pointer",
            transition: "all 150ms",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#1A2640";
            e.currentTarget.style.color = "#EF4444";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "none";
            e.currentTarget.style.color = "#7A8BA6";
          }}
        >
          <LogOut size={15} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Abmelden</span>}
        </button>

        <button
          onClick={() => setCollapsed((v) => !v)}
          style={{
            width: "100%", display: "flex", alignItems: "center",
            gap: collapsed ? 0 : 10,
            padding: collapsed ? "8px 0" : "8px 12px",
            justifyContent: collapsed ? "center" : "flex-start",
            borderRadius: 8, fontSize: 11, color: "#7A8BA6",
            background: "none", border: "none", cursor: "pointer",
            transition: "all 150ms",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#1A2640"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
        >
          {collapsed ? <ChevronRight size={14} /> : (
            <>
              <ChevronLeft size={14} />
              <span>Menü einkappen</span>
            </>
          )}
        </button>

        {!collapsed && (
          <p style={{ padding: "4px 12px 2px", fontSize: 10, color: "#7A8BA6", margin: 0 }}>v0.7.6</p>
        )}
      </div>
    </aside>
  );
}
