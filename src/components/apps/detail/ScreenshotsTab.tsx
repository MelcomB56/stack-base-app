"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, Trash2, X, ChevronLeft, ChevronRight, ImageIcon, Loader2 } from "lucide-react";
import { useCan } from "@/lib/permissions-context";

type Screenshot = {
  id: string;
  title: string | null;
  description: string | null;
  fileUrl: string;
  fileSize: number | null;
  sortOrder: number;
  createdAt: string;
};

interface Props {
  appSlug: string;
  initial: Screenshot[];
}

function formatBytes(b: number | null): string {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export function ScreenshotsTab({ appSlug, initial }: Props) {
  const canUpload = useCan("app_screenshots.create");
  const canDelete = useCan("app_screenshots.delete");

  const [screenshots, setScreenshots] = useState<Screenshot[]>(initial);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox Keyboard-Navigation
  useEffect(() => {
    if (lightbox === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowLeft") setLightbox((i) => i !== null && i > 0 ? i - 1 : i);
      if (e.key === "ArrowRight") setLightbox((i) => i !== null && i < screenshots.length - 1 ? i + 1 : i);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightbox, screenshots.length]);

  const upload = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) { setError("Nur Bilddateien erlaubt"); return; }

    setUploading(true);
    setError(null);

    for (const file of list) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", file.name.replace(/\.[^.]+$/, ""));
      try {
        const res = await fetch(`/api/apps/${appSlug}/screenshots`, { method: "POST", body: fd });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Upload fehlgeschlagen");
          break;
        }
        const created: Screenshot = await res.json();
        setScreenshots((prev) => [...prev, { ...created, createdAt: created.createdAt }]);
      } catch {
        setError("Netzwerkfehler beim Upload");
        break;
      }
    }
    setUploading(false);
  }, [appSlug]);

  const deleteScreenshot = useCallback(async (s: Screenshot) => {
    if (!confirm(`"${s.title ?? "Screenshot"}" wirklich löschen?`)) return;
    const res = await fetch(`/api/apps/${appSlug}/screenshots/${s.id}`, { method: "DELETE" });
    if (res.ok) setScreenshots((prev) => prev.filter((x) => x.id !== s.id));
  }, [appSlug]);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Upload-Zone */}
      {canUpload && <div
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => !uploading && fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? "#2563E8" : "#1E3050"}`,
          borderRadius: 12,
          padding: "24px 0",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
          background: dragOver ? "rgba(37,99,232,0.06)" : "#0B1220",
          cursor: uploading ? "not-allowed" : "pointer",
          transition: "all 150ms",
        }}
      >
        {uploading ? (
          <>
            <Loader2 size={24} style={{ color: "#2563E8", animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: 13, color: "#7A8BA6" }}>Wird hochgeladen…</span>
          </>
        ) : (
          <>
            <Upload size={22} style={{ color: dragOver ? "#2563E8" : "#7A8BA6" }} />
            <span style={{ fontSize: 13, color: dragOver ? "#2563E8" : "#7A8BA6" }}>
              Bilder hierher ziehen oder klicken zum Auswählen
            </span>
            <span style={{ fontSize: 11, color: "#7A8BA6" }}>JPEG, PNG, WebP, GIF · max. 10 MB</span>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => e.target.files && upload(e.target.files)}
        />
      </div>}

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", fontSize: 12, color: "#F87171" }}>
          <span style={{ flex: 1 }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "#F87171", cursor: "pointer", padding: 0 }}><X size={13} /></button>
        </div>
      )}

      {/* Galerie-Grid */}
      {screenshots.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "40px 0", color: "#7A8BA6" }}>
          <ImageIcon size={32} style={{ opacity: 0.3 }} />
          <p style={{ margin: 0, fontSize: 14 }}>Noch keine Screenshots vorhanden.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {screenshots.map((s, idx) => (
            <div
              key={s.id}
              style={{ position: "relative", borderRadius: 10, overflow: "hidden", background: "#111C2D", border: "1px solid #1E3050", cursor: "pointer", aspectRatio: "16/9" }}
              onClick={() => setLightbox(idx)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.fileUrl}
                alt={s.title ?? "Screenshot"}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              {/* Hover-Overlay */}
              <div className="screenshot-overlay" style={{
                position: "absolute", inset: 0,
                background: "rgba(0,0,0,0.55)",
                display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-end",
                padding: "10px 12px", opacity: 0, transition: "opacity 150ms",
              }}>
                {s.title && (
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#EDF2F7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
                    {s.title}
                  </span>
                )}
                {s.fileSize && (
                  <span style={{ fontSize: 10, color: "#7A8BA6" }}>{formatBytes(s.fileSize)}</span>
                )}
              </div>
              {/* Löschen-Button */}
              {canDelete && <button
                className="screenshot-delete"
                onClick={(e) => { e.stopPropagation(); deleteScreenshot(s); }}
                style={{
                  position: "absolute", top: 8, right: 8,
                  width: 28, height: 28, borderRadius: "50%",
                  background: "rgba(0,0,0,0.65)", border: "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#F87171", cursor: "pointer", opacity: 0, transition: "opacity 150ms",
                }}
              >
                <Trash2 size={13} />
              </button>}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && screenshots[lightbox] && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.88)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={() => setLightbox(null)}
        >
          {/* Schließen */}
          <button
            onClick={() => setLightbox(null)}
            style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: "#EDF2F7", cursor: "pointer" }}
          >
            <X size={20} />
          </button>

          {/* Prev */}
          {lightbox > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox((i) => (i ?? 1) - 1); }}
              style={{ position: "absolute", left: 16, background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", color: "#EDF2F7", cursor: "pointer" }}
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {/* Next */}
          {lightbox < screenshots.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox((i) => (i ?? 0) + 1); }}
              style={{ position: "absolute", right: 16, background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", color: "#EDF2F7", cursor: "pointer" }}
            >
              <ChevronRight size={22} />
            </button>
          )}

          {/* Bild */}
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: "90vw", maxHeight: "85vh", display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={screenshots[lightbox].fileUrl}
              alt={screenshots[lightbox].title ?? "Screenshot"}
              style={{ maxWidth: "100%", maxHeight: "78vh", objectFit: "contain", borderRadius: 8 }}
            />
            {screenshots[lightbox].title && (
              <span style={{ fontSize: 13, color: "#EDF2F7", fontWeight: 500 }}>{screenshots[lightbox].title}</span>
            )}
            <span style={{ fontSize: 11, color: "#7A8BA6" }}>{lightbox + 1} / {screenshots.length}</span>
          </div>
        </div>
      )}

      <style>{`
        .screenshot-overlay { opacity: 0 !important; }
        .screenshot-delete { opacity: 0 !important; }
        div:hover > .screenshot-overlay { opacity: 1 !important; }
        div:hover > .screenshot-delete { opacity: 1 !important; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
