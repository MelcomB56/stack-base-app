"use client";

import { useState, useRef, useEffect } from "react";
import { ExternalLink, GitBranch, Edit, ChevronDown } from "lucide-react";
import Link from "next/link";
import { FavoriteButton } from "./FavoriteButton";
import { GitHubSyncButton } from "./GitHubSyncButton";

interface Props {
  appId: string;
  appSlug: string;
  urlProd?: string | null;
  repoUrl?: string | null;
  isFavorited: boolean;
}

const ITEM: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 8,
  padding: "8px 14px", fontSize: 12, color: "#EDF2F7",
  textDecoration: "none", background: "none", border: "none",
  cursor: "pointer", width: "100%", textAlign: "left",
  transition: "background 120ms",
};

export function AppDetailActions({ appId, appSlug, urlProd, repoUrl, isFavorited }: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [open]);

  const hasGithub = !!(repoUrl?.includes("github.com"));

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
      <FavoriteButton appId={appId} initialFavorited={isFavorited} />

      {urlProd && (
        <a
          href={urlProd}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "6px 12px", background: "#2563E8", color: "#fff",
            borderRadius: 7, fontSize: 11, fontWeight: 500, textDecoration: "none",
          }}
        >
          <ExternalLink size={10} /> Öffnen
        </a>
      )}

      <div ref={menuRef} style={{ position: "relative" }}>
        <button
          onClick={() => setOpen((o) => !o)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "6px 12px", background: "#1A2640", color: "#EDF2F7",
            borderRadius: 7, fontSize: 11, fontWeight: 500,
            border: "1px solid #1E3050", cursor: "pointer",
          }}
        >
          Aktionen
          <ChevronDown size={11} style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform 150ms" }} />
        </button>

        {open && (
          <div style={{
            position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 50,
            background: "#111C2D", border: "1px solid #1E3050", borderRadius: 8,
            minWidth: 180, overflow: "hidden",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}>
            {repoUrl && (
              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#1A2640")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                style={ITEM}
              >
                <GitBranch size={12} style={{ color: "#7A8BA6", flexShrink: 0 }} />
                Repository
              </a>
            )}

            {hasGithub && (
              <div
                onMouseEnter={(e) => (e.currentTarget.style.background = "#1A2640")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                style={{ transition: "background 120ms" }}
              >
                <GitHubSyncButton appSlug={appSlug} menuItem onSync={() => setOpen(false)} />
              </div>
            )}

            <div style={{ height: 1, background: "#1E3050", margin: "2px 0" }} />

            <Link
              href={`/apps/${appSlug}/edit`}
              onClick={() => setOpen(false)}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#1A2640")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              style={ITEM}
            >
              <Edit size={12} style={{ color: "#7A8BA6", flexShrink: 0 }} />
              Bearbeiten
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
