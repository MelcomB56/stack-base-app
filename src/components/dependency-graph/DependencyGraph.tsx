"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from "lucide-react";

// ─── Types ───────────────────────────────────────────────

interface AppNode {
  id: string;
  name: string;
  slug: string;
  status: string;
  shortDesc: string;
}

interface Dependency {
  id: string;
  appId: string;
  dependsOnAppId: string | null;
  dependsOnName: string | null;
  relationshipType: string;
  description: string | null;
}

interface SimNode {
  id: string;
  name: string;
  slug?: string;
  status?: string;
  shortDesc?: string;
  isExternal: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  pinned: boolean;
}

interface SimEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
  description?: string | null;
}

// ─── Constants ───────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  PRODUCTION: "#10B981",
  DEVELOPMENT: "#3B82F6",
  TESTING: "#F59E0B",
  MAINTENANCE: "#F97316",
  ARCHIVED: "#6B7280",
};

const REL_COLOR: Record<string, string> = {
  REQUIRES: "#2563E8",
  USES_API: "#8B5CF6",
  USES_SERVICE: "#10B981",
  CONTAINS: "#F59E0B",
  PLANNED: "#6B7280",
};

const REL_LABEL: Record<string, string> = {
  REQUIRES: "benötigt",
  USES_API: "API",
  USES_SERVICE: "Service",
  CONTAINS: "enthält",
  PLANNED: "geplant",
};

const NODE_R = 30;
const EXT_R = 20;
const K_REP = 14000;
const K_ATT = 0.012;
const K_GRAV = 0.006;
const DAMP = 0.86;
const REST_LEN = 200;

// ─── Build graph ─────────────────────────────────────────

function buildGraph(apps: AppNode[], deps: Dependency[]) {
  const nodes: SimNode[] = [];
  const nodeMap = new Map<string, SimNode>();

  apps.forEach((a, i) => {
    const total = apps.length;
    const angle = (2 * Math.PI * i) / total;
    const r = Math.max(180, total * 30);
    const n: SimNode = {
      id: a.id, name: a.name, slug: a.slug, status: a.status, shortDesc: a.shortDesc,
      isExternal: false,
      x: Math.cos(angle) * r + (Math.random() - 0.5) * 30,
      y: Math.sin(angle) * r + (Math.random() - 0.5) * 30,
      vx: 0, vy: 0, pinned: false,
    };
    nodes.push(n);
    nodeMap.set(a.id, n);
  });

  const edges: SimEdge[] = [];

  deps.forEach((d) => {
    const targetId = d.dependsOnAppId ?? `ext:${d.dependsOnName ?? "unknown"}`;
    if (!nodeMap.has(targetId)) {
      const extN: SimNode = {
        id: targetId, name: d.dependsOnName ?? "Extern", isExternal: true,
        x: (Math.random() - 0.5) * 500, y: (Math.random() - 0.5) * 500,
        vx: 0, vy: 0, pinned: false,
      };
      nodes.push(extN);
      nodeMap.set(targetId, extN);
    }
    if (nodeMap.has(d.appId) && nodeMap.has(targetId)) {
      edges.push({ id: d.id, sourceId: d.appId, targetId, type: d.relationshipType, description: d.description });
    }
  });

  return { nodes, edges };
}

// ─── Physics ─────────────────────────────────────────────

function simulate(nodes: SimNode[], edges: SimEdge[]) {
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      const d2 = Math.max(dx * dx + dy * dy, 900);
      const d = Math.sqrt(d2);
      const f = K_REP / d2;
      if (!a.pinned) { a.vx -= (f * dx) / d; a.vy -= (f * dy) / d; }
      if (!b.pinned) { b.vx += (f * dx) / d; b.vy += (f * dy) / d; }
    }
  }
  const byId = new Map(nodes.map((n) => [n.id, n]));
  for (const e of edges) {
    const src = byId.get(e.sourceId), tgt = byId.get(e.targetId);
    if (!src || !tgt) continue;
    const dx = tgt.x - src.x, dy = tgt.y - src.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const f = K_ATT * (d - REST_LEN);
    if (!src.pinned) { src.vx += (f * dx) / d; src.vy += (f * dy) / d; }
    if (!tgt.pinned) { tgt.vx -= (f * dx) / d; tgt.vy -= (f * dy) / d; }
  }
  for (const n of nodes) {
    if (!n.pinned) {
      n.vx += -n.x * K_GRAV;
      n.vy += -n.y * K_GRAV;
      n.vx *= DAMP;
      n.vy *= DAMP;
      n.x += n.vx;
      n.y += n.vy;
    }
  }
}

// ─── Draw ────────────────────────────────────────────────

function draw(
  canvas: HTMLCanvasElement,
  nodes: SimNode[],
  edges: SimEdge[],
  tx: number,
  ty: number,
  scale: number,
  hoverId: string | null,
) {
  const ctx = canvas.getContext("2d")!;
  const dpr = window.devicePixelRatio || 1;
  const cw = canvas.width / dpr;
  const ch = canvas.height / dpr;

  // Reset transform to DPR base each frame
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cw, ch);

  ctx.save();
  ctx.translate(tx, ty);
  ctx.scale(scale, scale);

  const byId = new Map(nodes.map((n) => [n.id, n]));

  // ── Edges ──
  for (const e of edges) {
    const src = byId.get(e.sourceId), tgt = byId.get(e.targetId);
    if (!src || !tgt) continue;
    const isActive = hoverId === src.id || hoverId === tgt.id;
    const color = REL_COLOR[e.type] ?? "#7A8BA6";
    const dx = tgt.x - src.x, dy = tgt.y - src.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / len, uy = dy / len;
    const srcR = src.isExternal ? EXT_R : NODE_R;
    const tgtR = tgt.isExternal ? EXT_R : NODE_R;
    const x1 = src.x + ux * srcR, y1 = src.y + uy * srcR;
    const x2 = tgt.x - ux * (tgtR + 9), y2 = tgt.y - uy * (tgtR + 9);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = isActive ? color : color + "88";
    ctx.lineWidth = isActive ? 2 : 1.2;
    if (e.type === "PLANNED") ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Arrowhead
    const perpX = -uy * 5, perpY = ux * 5;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - ux * 10 + perpX, y2 - uy * 10 + perpY);
    ctx.lineTo(x2 - ux * 10 - perpX, y2 - uy * 10 - perpY);
    ctx.closePath();
    ctx.fillStyle = isActive ? color : color + "88";
    ctx.fill();

    // Label on active edge
    if (isActive && len > 60) {
      const mx = (src.x + tgt.x) / 2, my = (src.y + tgt.y) / 2;
      const label = REL_LABEL[e.type] ?? e.type;
      ctx.font = "bold 10px system-ui";
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = "#0B1220cc";
      ctx.fillRect(mx - tw / 2 - 5, my - 9, tw + 10, 16);
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, mx, my);
    }
  }

  // ── Nodes ──
  for (const n of nodes) {
    const r = n.isExternal ? EXT_R : NODE_R;
    const baseColor = n.isExternal ? "#94A3B8" : (STATUS_COLOR[n.status ?? ""] ?? "#6B7280");
    const isHover = n.id === hoverId;

    // Outer glow on hover
    if (isHover) {
      const grad = ctx.createRadialGradient(n.x, n.y, r, n.x, n.y, r + 16);
      grad.addColorStop(0, baseColor + "44");
      grad.addColorStop(1, baseColor + "00");
      ctx.beginPath();
      ctx.arc(n.x, n.y, r + 16, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Fill
    ctx.beginPath();
    ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
    ctx.fillStyle = baseColor + (isHover ? "44" : "33");
    ctx.fill();

    // Border
    ctx.beginPath();
    ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = isHover ? baseColor : baseColor + "bb";
    ctx.lineWidth = isHover ? 2.5 : 1.8;
    if (n.isExternal) ctx.setLineDash([5, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Initials
    ctx.font = `700 ${n.isExternal ? 11 : 13}px system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = isHover ? baseColor : baseColor + "dd";
    const initials = n.name.split(/[\s\-_]+/).map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
    ctx.fillText(initials, n.x, n.y);

    // Name label below node
    ctx.font = `${isHover ? "600" : "500"} 11px system-ui`;
    ctx.textBaseline = "top";
    ctx.fillStyle = isHover ? "#EDF2F7" : "#8FA3BE";
    const label = n.name.length > 14 ? n.name.slice(0, 13) + "…" : n.name;
    ctx.fillText(label, n.x, n.y + r + 5);
  }

  ctx.restore();
}

// ─── Component ───────────────────────────────────────────

export function DependencyGraph({ apps, dependencies }: { apps: AppNode[]; dependencies: Dependency[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  const stateRef = useRef({
    nodes: [] as SimNode[],
    edges: [] as SimEdge[],
    tx: 0, ty: 0, scale: 1,
    hoverId: null as string | null,
    dragId: null as string | null,
    dragOffX: 0, dragOffY: 0,
    panStart: null as { mx: number; my: number; tx0: number; ty0: number } | null,
    animId: 0,
    alive: true,
    ready: false,
  });

  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: SimNode } | null>(null);

  // Init graph data
  useEffect(() => {
    const { nodes, edges } = buildGraph(apps, dependencies);
    stateRef.current.nodes = nodes;
    stateRef.current.edges = edges;
  }, [apps, dependencies]);

  // Setup canvas + animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const s = stateRef.current;
    s.alive = true;

    const initCanvas = () => {
      const parent = canvas.parentElement!;
      const dpr = window.devicePixelRatio || 1;
      const w = parent.clientWidth || 800;
      const h = parent.clientHeight || 600;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      if (!s.ready) {
        s.tx = w / 2;
        s.ty = h / 2;
        s.ready = true;
      }
    };

    initCanvas();

    const loop = () => {
      if (!s.alive) return;
      simulate(s.nodes, s.edges);
      draw(canvas, s.nodes, s.edges, s.tx, s.ty, s.scale, s.hoverId);
      s.animId = requestAnimationFrame(loop);
    };
    s.animId = requestAnimationFrame(loop);

    const ro = new ResizeObserver(() => {
      initCanvas();
    });
    ro.observe(canvas.parentElement!);

    return () => {
      s.alive = false;
      cancelAnimationFrame(s.animId);
      ro.disconnect();
    };
  }, []);

  // Coord helpers
  const toWorld = (ex: number, ey: number, rect: DOMRect) => {
    const s = stateRef.current;
    return {
      x: (ex - rect.left - s.tx) / s.scale,
      y: (ey - rect.top - s.ty) / s.scale,
    };
  };

  const hitNode = (wx: number, wy: number) => {
    for (const n of stateRef.current.nodes) {
      const r = n.isExternal ? EXT_R : NODE_R;
      if ((wx - n.x) ** 2 + (wy - n.y) ** 2 < r * r) return n;
    }
    return null;
  };

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const { x: wx, y: wy } = toWorld(e.clientX, e.clientY, rect);

    if (s.dragId) {
      const n = s.nodes.find((n) => n.id === s.dragId);
      if (n) { n.x = wx + s.dragOffX; n.y = wy + s.dragOffY; n.vx = 0; n.vy = 0; }
      return;
    }
    if (s.panStart) {
      s.tx = s.panStart.tx0 + (e.clientX - s.panStart.mx);
      s.ty = s.panStart.ty0 + (e.clientY - s.panStart.my);
      e.currentTarget.style.cursor = "grabbing";
      setTooltip(null);
      return;
    }
    const hit = hitNode(wx, wy);
    s.hoverId = hit?.id ?? null;
    e.currentTarget.style.cursor = hit ? "pointer" : "grab";
    if (hit) setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, node: hit });
    else setTooltip(null);
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const { x: wx, y: wy } = toWorld(e.clientX, e.clientY, rect);
    const hit = hitNode(wx, wy);
    if (hit) {
      s.dragId = hit.id;
      s.dragOffX = hit.x - wx;
      s.dragOffY = hit.y - wy;
    } else {
      s.panStart = { mx: e.clientX, my: e.clientY, tx0: s.tx, ty0: s.ty };
    }
  }, []);

  const onMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.dragId) { s.dragId = null; }
    s.panStart = null;
    e.currentTarget.style.cursor = "grab";
  }, []);

  const onClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.panStart !== null || s.dragId !== null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const { x: wx, y: wy } = toWorld(e.clientX, e.clientY, rect);
    const hit = hitNode(wx, wy);
    if (hit?.slug) router.push(`/apps/${hit.slug}`);
  }, [router]);

  const onWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const s = stateRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.12 : 0.9;
    s.tx = px + (s.tx - px) * factor;
    s.ty = py + (s.ty - py) * factor;
    s.scale = Math.min(4, Math.max(0.15, s.scale * factor));
  }, []);

  const zoom = (dir: 1 | -1) => {
    const s = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.clientWidth / 2, cy = canvas.clientHeight / 2;
    const factor = dir > 0 ? 1.2 : 0.83;
    s.tx = cx + (s.tx - cx) * factor;
    s.ty = cy + (s.ty - cy) * factor;
    s.scale = Math.min(4, Math.max(0.15, s.scale * factor));
  };

  const fitToScreen = () => {
    const s = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas || s.nodes.length === 0) return;
    const xs = s.nodes.map((n) => n.x), ys = s.nodes.map((n) => n.y);
    const minX = Math.min(...xs) - 60, maxX = Math.max(...xs) + 60;
    const minY = Math.min(...ys) - 60, maxY = Math.max(...ys) + 60;
    const sc = Math.min(3, Math.max(0.15, Math.min(
      canvas.clientWidth / (maxX - minX),
      canvas.clientHeight / (maxY - minY)
    ) * 0.88));
    s.scale = sc;
    s.tx = canvas.clientWidth / 2 - ((minX + maxX) / 2) * sc;
    s.ty = canvas.clientHeight / 2 - ((minY + maxY) / 2) * sc;
  };

  const resetGraph = () => {
    const s = stateRef.current;
    const { nodes, edges } = buildGraph(apps, dependencies);
    s.nodes = nodes;
    s.edges = edges;
    const canvas = canvasRef.current;
    if (canvas) { s.tx = canvas.clientWidth / 2; s.ty = canvas.clientHeight / 2; s.scale = 1; }
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#080F1A" }}>
      <canvas
        ref={canvasRef}
        style={{ display: "block", cursor: "grab" }}
        onMouseMove={onMouseMove}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onClick={onClick}
        onWheel={onWheel}
      />

      {/* Toolbar */}
      <div style={{ position: "absolute", top: 12, right: 12, display: "flex", flexDirection: "column", gap: 4 }}>
        {([
          { icon: <ZoomIn size={13} />, fn: () => zoom(1), title: "Zoom in" },
          { icon: <ZoomOut size={13} />, fn: () => zoom(-1), title: "Zoom out" },
          { icon: <Maximize2 size={13} />, fn: fitToScreen, title: "Fit to screen" },
          { icon: <RotateCcw size={13} />, fn: resetGraph, title: "Zurücksetzen" },
        ] as const).map(({ icon, fn, title }) => (
          <button key={title} onClick={fn} title={title} style={{
            width: 32, height: 32, borderRadius: 6, background: "#111C2D",
            border: "1px solid #1E3050", color: "#7A8BA6", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {icon}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        position: "absolute", bottom: 12, left: 12, background: "#111C2D",
        border: "1px solid #1E3050", borderRadius: 8, padding: "10px 14px",
      }}>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#7A8BA6", margin: "0 0 6px" }}>Verbindungstyp</p>
        {Object.entries(REL_LABEL).map(([type, label]) => (
          <div key={type} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
            <span style={{ width: 22, height: 2, background: REL_COLOR[type], borderRadius: 1, display: "block", flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: "#8FA3BE" }}>{label}</span>
          </div>
        ))}
        <p style={{ fontSize: 9, color: "#4A5568", margin: "8px 0 0", lineHeight: 1.6 }}>
          Drag = bewegen · Scroll = Zoom<br />Klick = App öffnen
        </p>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: "absolute", left: tooltip.x + 16, top: tooltip.y - 12,
          background: "#111C2D", border: "1px solid #1E3050", borderRadius: 8,
          padding: "8px 12px", pointerEvents: "none", zIndex: 10, minWidth: 160,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: tooltip.node.shortDesc ? 4 : 0 }}>
            {!tooltip.node.isExternal && (
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLOR[tooltip.node.status ?? ""] ?? "#6B7280", flexShrink: 0 }} />
            )}
            <span style={{ fontSize: 12, fontWeight: 700, color: "#EDF2F7" }}>{tooltip.node.name}</span>
          </div>
          {tooltip.node.isExternal && (
            <span style={{ fontSize: 10, color: "#F59E0B", display: "block", marginBottom: 2 }}>Externe Abhängigkeit</span>
          )}
          {tooltip.node.shortDesc && (
            <p style={{ fontSize: 11, color: "#7A8BA6", margin: 0, lineHeight: 1.4 }}>{tooltip.node.shortDesc}</p>
          )}
          {tooltip.node.slug && (
            <p style={{ fontSize: 10, color: "#2563E8", margin: "4px 0 0" }}>→ Klicken zum Öffnen</p>
          )}
        </div>
      )}
    </div>
  );
}
