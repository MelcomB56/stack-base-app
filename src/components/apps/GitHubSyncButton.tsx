"use client";

import { useState } from "react";
import { GitBranch, Loader2, CheckCircle, AlertCircle } from "lucide-react";

type SyncResult = {
  imported: number;
  total: number;
  isPrivate: boolean;
  privateTagSet: boolean;
  repo: string;
};

export function GitHubSyncButton({ appSlug }: { appSlug: string }) {
  const [state, setState] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [result, setResult] = useState<SyncResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function sync() {
    setState("syncing");
    setResult(null);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/apps/${appSlug}/github-sync`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Unbekannter Fehler");
        setState("error");
        return;
      }
      setResult(data);
      setState("success");
      // Nach 6s zurücksetzen
      setTimeout(() => setState("idle"), 6000);
    } catch {
      setErrorMsg("Netzwerkfehler");
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  }

  if (state === "success" && result) {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 7, fontSize: 11, color: "#10B981" }}>
        <CheckCircle size={11} />
        {result.imported > 0
          ? `${result.imported} Release${result.imported > 1 ? "s" : ""} importiert`
          : "Bereits aktuell"}
        {result.isPrivate && " · Privat-Tag gesetzt"}
      </div>
    );
  }

  if (state === "error") {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 7, fontSize: 11, color: "#F87171" }}>
        <AlertCircle size={11} />
        {errorMsg}
      </div>
    );
  }

  return (
    <button
      onClick={sync}
      disabled={state === "syncing"}
      title="Releases & Changelog von GitHub synchronisieren"
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "6px 12px", background: "#1A2640", color: "#EDF2F7",
        borderRadius: 7, fontSize: 11, border: "1px solid #1E3050",
        cursor: state === "syncing" ? "not-allowed" : "pointer",
        opacity: state === "syncing" ? 0.7 : 1,
      }}>
      {state === "syncing"
        ? <Loader2 size={11} className="animate-spin" />
        : <GitBranch size={11} />}
      {state === "syncing" ? "Synchronisiere…" : "GitHub Sync"}
    </button>
  );
}
