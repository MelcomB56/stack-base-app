"use client";

import { useRef, useEffect } from "react";

const REL_COLOR: Record<string, string> = {
  REQUIRES: "#2563E8", USES_API: "#7C3AED", USES_SERVICE: "#10B981",
  CONTAINS: "#F59E0B", PLANNED: "#6B7280",
};
const REL_LABEL: Record<string, string> = {
  REQUIRES: "benötigt", USES_API: "nutzt API", USES_SERVICE: "nutzt Service",
  CONTAINS: "enthält", PLANNED: "geplant",
};
const STATUS_COLOR: Record<string, string> = {
  PRODUCTION: "#10B981", DEVELOPMENT: "#3B82F6", TESTING: "#F59E0B",
  MAINTENANCE: "#F97316", ARCHIVED: "#6B7280",
};

type DepNode = {
  name: string;
  slug?: string | null;
  status?: string | null;
  relationshipType: string;
  side: "out" | "in";
};

export function AppDepGraph({
  appName,
  outgoing,
  incoming,
}: {
  appName: string;
  outgoing: { name: string; slug?: string | null; status?: string | null; relationshipType: string }[];
  incoming: { name: string; slug?: string | null; status?: string | null; relationshipType: string }[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // getContext("2d") gibt auf einem HTMLCanvasElement nie null zurück
    const ctx = canvas.getContext("2d")!

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Nodes aufbauen
    const deps: DepNode[] = [
      ...outgoing.map((d) => ({ ...d, side: "out" as const })),
      ...incoming.map((d) => ({ ...d, side: "in" as const })),
    ];

    const CX = W / 2;
    const CY = H / 2;
    const R_CENTER = 36;
    const R_NODE = 26;
    const ORBIT = Math.min(W, H) * 0.35;

    // Positionen berechnen — Ausgehende rechts, Eingehende links
    function placeNodes(nodes: DepNode[], side: "out" | "in") {
      const n = nodes.length;
      if (n === 0) return [];
      const baseAngle = side === "out" ? 0 : Math.PI;
      const spread = n === 1 ? 0 : (Math.PI * 0.7) / (n - 1);
      const startAngle = baseAngle - (n === 1 ? 0 : (Math.PI * 0.7) / 2);
      return nodes.map((node, i) => {
        const angle = startAngle + i * spread;
        return {
          node,
          x: CX + Math.cos(angle) * ORBIT,
          y: CY + Math.sin(angle) * ORBIT,
        };
      });
    }

    const outPos = placeNodes(outgoing.map((d) => ({ ...d, side: "out" as const })), "out");
    const inPos = placeNodes(incoming.map((d) => ({ ...d, side: "in" as const })), "in");
    const allPos = [...outPos, ...inPos];

    // Zeichnen
    ctx.fillStyle = "#080F1A";
    ctx.fillRect(0, 0, W, H);

    // Hilfslinien — Grid-Gitter dezent
    ctx.strokeStyle = "rgba(30,48,80,0.3)";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    function drawArrow(
      x1: number, y1: number, x2: number, y2: number,
      color: string, label: string, toCenter: boolean
    ) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) return;
      const ux = dx / len;
      const uy = dy / len;

      const startR = toCenter ? R_NODE : R_CENTER;
      const endR = toCenter ? R_CENTER : R_NODE;

      const sx = x1 + ux * startR;
      const sy = y1 + uy * startR;
      const ex = x2 - ux * (endR + 6);
      const ey = y2 - uy * (endR + 6);

      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = color + "99";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.stroke();

      // Pfeilspitze
      const angle = Math.atan2(ey - sy, ex - sx);
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - 8 * Math.cos(angle - 0.4), ey - 8 * Math.sin(angle - 0.4));
      ctx.lineTo(ex - 8 * Math.cos(angle + 0.4), ey - 8 * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fillStyle = color + "cc";
      ctx.fill();

      // Label an der Mitte
      const mx = (sx + ex) / 2;
      const my = (sy + ey) / 2;
      ctx.font = "9px system-ui, sans-serif";
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = "rgba(8,15,26,0.85)";
      ctx.fillRect(mx - tw / 2 - 4, my - 7, tw + 8, 13);
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, mx, my);
    }

    // Pfeile zeichnen
    for (const { node, x, y } of outPos) {
      drawArrow(CX, CY, x, y, REL_COLOR[node.relationshipType] ?? "#6B7280", REL_LABEL[node.relationshipType] ?? node.relationshipType, false);
    }
    for (const { node, x, y } of inPos) {
      drawArrow(x, y, CX, CY, REL_COLOR[node.relationshipType] ?? "#6B7280", REL_LABEL[node.relationshipType] ?? node.relationshipType, true);
    }

    function drawNode(x: number, y: number, label: string, r: number, fillHex: string, statusColor?: string) {
      // Glow
      const grd = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * 1.8);
      grd.addColorStop(0, fillHex + "22");
      grd.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(x, y, r * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Fill
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = fillHex + "1a";
      ctx.fill();
      ctx.strokeStyle = fillHex + "bb";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Status-Dot
      if (statusColor) {
        ctx.beginPath();
        ctx.arc(x + r * 0.7, y - r * 0.7, 4, 0, Math.PI * 2);
        ctx.fillStyle = statusColor;
        ctx.fill();
      }

      // Label
      ctx.font = `${r < 32 ? 10 : 11}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#EDF2F7";

      // Text umbrechen wenn nötig
      const words = label.split(" ");
      if (words.length > 1 && ctx.measureText(label).width > r * 1.6) {
        const mid = Math.ceil(words.length / 2);
        const line1 = words.slice(0, mid).join(" ");
        const line2 = words.slice(mid).join(" ");
        ctx.fillText(line1, x, y - 7);
        ctx.fillText(line2, x, y + 7);
      } else {
        ctx.fillText(label.length > 14 ? label.slice(0, 13) + "…" : label, x, y);
      }
    }

    // Äußere Nodes
    for (const { node, x, y } of allPos) {
      const statusColor = node.status ? STATUS_COLOR[node.status] ?? "#6B7280" : undefined;
      drawNode(x, y, node.name, R_NODE, "#2563E8", statusColor);
    }

    // Leere Hinweis
    if (allPos.length === 0) {
      ctx.font = "13px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#7A8BA6";
      ctx.fillText("Keine Abhängigkeiten eingetragen", CX, CY);
    }

    // Center-Node (zuletzt, über allem)
    drawNode(CX, CY, appName, R_CENTER, "#22D3EE");

    // Legende
    const legendItems = [...new Set(deps.map((d) => d.relationshipType))];
    if (legendItems.length > 0) {
      let lx = 12;
      const ly = H - 20;
      ctx.font = "10px system-ui, sans-serif";
      ctx.textBaseline = "middle";
      for (const rel of legendItems) {
        const color = REL_COLOR[rel] ?? "#6B7280";
        const label = REL_LABEL[rel] ?? rel;
        ctx.beginPath();
        ctx.rect(lx, ly - 5, 10, 10);
        ctx.fillStyle = color + "33";
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = "#7A8BA6";
        ctx.textAlign = "left";
        ctx.fillText(label, lx + 13, ly);
        lx += ctx.measureText(label).width + 30;
      }
    }

    // Richtungs-Legende
    if (outgoing.length > 0 || incoming.length > 0) {
      ctx.font = "10px system-ui, sans-serif";
      ctx.textBaseline = "middle";
      ctx.textAlign = "right";
      ctx.fillStyle = "#4A5B6F";
      if (outgoing.length > 0) ctx.fillText("→ hängt ab von", W - 10, 16);
      if (incoming.length > 0) ctx.fillText("← wird genutzt von", W - 10, 30);
    }

  }, [appName, outgoing, incoming]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: 300, borderRadius: 10, display: "block", background: "#080F1A" }}
    />
  );
}
