"use client";

import { useSession } from "next-auth/react";
import { Bell, Search } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function Topbar({ title }: { title?: string }) {
  const { data: session } = useSession();
  const [q, setQ] = useState("");
  const router = useRouter();

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <header className="h-14 flex items-center gap-4 px-6 border-b border-border sticky top-0 z-30"
      style={{ background: "rgba(11,18,32,0.85)", backdropFilter: "blur(8px)" }}>
      {/* Page title */}
      {title && (
        <h1 className="text-sm font-semibold text-foreground whitespace-nowrap">{title}</h1>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Global Search */}
      <form onSubmit={handleSearch} className="relative hidden sm:block">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Suchen…"
          className="w-56 pl-8 pr-3 py-1.5 text-sm bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all focus:w-72"
        />
      </form>

      {/* Notifications */}
      <button className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-card text-muted-foreground hover:text-foreground transition-colors">
        <Bell size={16} />
        {/* Badge */}
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-warning border-2 border-background" />
      </button>

      {/* User Avatar */}
      <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center cursor-pointer hover:bg-primary/30 transition-colors">
        <span className="text-[10px] font-bold text-primary">{initials}</span>
      </div>
    </header>
  );
}
