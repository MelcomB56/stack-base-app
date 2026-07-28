"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  appId: string;
  initialFavorited: boolean;
}

export function FavoriteButton({ appId, initialFavorited }: Props) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (loading) return;
    const next = !favorited;
    setFavorited(next);
    setLoading(true);

    try {
      const res = await fetch("/api/favorites", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId }),
      });
      if (!res.ok && res.status !== 409) {
        setFavorited(!next);
      }
    } catch {
      setFavorited(!next);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={favorited ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-medium transition-all duration-200 disabled:opacity-60",
        favorited
          ? "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"
          : "border-border bg-card text-muted-foreground hover:border-red-500/30 hover:text-red-400"
      )}
    >
      <Heart
        size={12}
        className={cn("transition-all duration-200", favorited && "fill-red-400")}
      />
      {favorited ? "Favorit" : "Merken"}
    </button>
  );
}
