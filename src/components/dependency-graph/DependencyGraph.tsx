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

const NODE_RADIUS = 26;
const EXT_RADIUS = 18;
const SIM_STEPS = 1;
const K_REP = 18000;
const K_ATT = 0.015;
const K_GRAV = 0.008;
const DAMP = 0.88;
const REST_LEN = 180;

// ─── Build graph from API data ───────────────────────────

function buildGraph(apps: AppNode[], deps: Dependency[]) {
  const nodeMap = new Map<string, SimNode>();

  apps.forEach((a, i) => {
    const angle = (2 * Math.PI * i) / apps.length;
    const r = Math.max(200, apps.length * 25);
    nodeMap.set(a.id, {
      id: a.id,
      name: a.name,
      slug: a.slug,
      status: a.status,
      shortDesc: a.shortDesc,
      isExternal: false,
      x: Math.cos(angle) * r + (Math.random() - 0.5) * 40,
      y: Math.sin(angle) * r + (Math.random() - 0.5) * 40,
      vx: 0, vy: 0, pinned: false,
    });
  });

  const edges: SimEdge[] = [];
  deps.forEach((d) => {
    const targetId = d.dependsOnAppId ?? `ext:${d.dependsOnName}`;
    if (!nodeMap.has(targetId) && !d.dependsOnAppId) {
      nodeMap.set(targetId, {
        id: targetId,
        name: d.dependsOnName ?? "Extern",
        isExternal: true,
        x: (Math.random() - 0.5) * 600,
        y: (Math.random() - 0.5) * 600,
        vx: 0, vy: 0, pinned: false,
      });
    }
    if (nodeMap.has(d.appId) && nodeMap.has(targetId)) {
      edges.push({ id: d.id, sourceId: d.appId, targetId, type: d.relationshipType, description: d.description });
    }
  });

  return { nodes: Array.from(nodeMap.values()), edges };
}

// ─── Physics step ────────────────────────────────────────

function simulate(nodes: SimNode[], edges: SimEdge[], cx: number, cy: number) {
  // Repulsion between all node pairs
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      const d2 = Math.max(dx * dx + dy * dy, 400);
      const f = K_REP / d2;
      const d = Math.sqrt(d2);
      if (!a.pinned) { a.vx -= (f * dx) / d; a.vy -= (f * dy) / d; }
      if (!b.pinned) { b.vx += (f * dx) / d; b.vy += (f * dy) / d; }
    }
  }

  // Attraction along edges
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  for (const e of edges) {
    const src = nodeById.get(e.sourceId), tgt = nodeById.get(e.targetId);
    if (!src || !tgt) continue;
    const dx = tgt.x - src.x, dy = tgt.y - src.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const f = K_ATT * (d - REST_LEN);
    if (!src.pinned) { src.vx += (f * dx) / d; src.vy += (f * dy) / d; }
    if (!tgt.pinned) { tgt.vx -= (f * dx) / d; tgt.vy -= (f * dy) / d; }
  }

  // Gravity toward center
  for (const n of nodes) {
    if (!n.pinned) {
      n.vx += (cx - n.x) * K_GRAV;
      n.vy += (cy - n.y) * K_GRAV;
    }
    n.vx *= DAMP;
    n.vy *= DAMP;
    if (!n.pinned) { n.x += n.vx; n.y += n.vy; }
  }
}

// ─── Canvas draw ─────────────────────────────────────────

function draw(
  ctx: CanvasRenderingContext2D,
  nodes: SimNode[],
  edges: SimEdge[],
  transform: { x: number; y: number; scale: number },
  hoverId: string | null,
) {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);

  ctx.save();
  ctx.translate(transform.x, transform.y);
  ctx.scale(transform.scale, transform.scale);

  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  // ── Edges ──
  for (const e of edges) {
    const src = nodeById.get(e.sourceId), tgt = nodeById.get(e.targetId);
    if (!src || !tgt) continue;

    const dx = tgt.x - src.x, dy = tgt.y - src.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / len, uy = dy / len;
    const srcR = src.isExternal ? EXT_RADIUS : NODE_RADIUS;
    const tgtR = tgt.isExternal ? EXT_RADIUS : NODE_RADIUS;
    const x1 = src.x + ux * srcR, y1 = src.y + uy * srcR;
    const x2 = tgt.x - ux * (tgtR + 8), y2 = tgt.y - uy * (tgtR + 8);
    const color = REL_COLOR[e.type] ?? "#7A8BA6";
    const alpha = hoverId === src.id || hoverId === tgt.id ? 0.9 : 0.35;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color + Math.round(alpha * 255).toString(16).padStart(2, "0");
    ctx.lineWidth = hoverId === src.id || hoverId === tgt.id ? 2 : 1.2;
    ctx.setLineDash(e.type === "PLANNED" ? [5, 4] : []);
    ctx.stroke();
    ctx.setLineDash([]);

    // Arrow
    const ax = x2, ay = y2;
    const perpX = -uy, perpY = ux;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax - ux * 9 + perpX * 5, ay - uy * 9 + perpY * 5);
    ctx.lineTo(ax - ux * 9 - perpX * 5, ay - uy * 9 - perpY * 5);
    ctx.closePath();
    ctx.fillStyle = color + Math.round(alpha * 255).toString(16).padStart(2, "0");
    ctx.fill();

    // Edge label (midpoint)
    if (len > 80 && (hoverId === src.id || hoverId === tgt.id)) {
      const mx = (src.x + tgt.x) / 2, my = (src.y + tgt.y) / 2;
      const label = REL_LABEL[e.type] ?? e.type;
      ctx.save();
      ctx.font = "10px system-ui";
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = "#111C2D";
      ctx.fillRect(mx - tw / 2 - 4, my - 8, tw + 8, 14);
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, mx, my);
      ctx.restore();
    }
  }

  // ── Nodes ──
  for (const n of nodes) {
    const r = n.isExternal ? EXT_RADIUS : NODE_RADIUS;
    const color = n.isExternal ? "#374151" : (STATUS_COLOR[n.status ?? ""] ?? "#6B7280");
    const isHover = n.id === hoverId;

    // Glow
    if (isHover) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, r + 8, 0, Math.PI * 2);
      ctx.fillStyle = color + "33";
      ctx.fill();
    }

    // Circle fill
    ctx.beginPath();
    ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
    ctx.fillStyle = color + (isHover ? "33" : "22");
    ctx.fill();

    // Circle stroke
    ctx.beginPath();
    ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = color + (isHover ? "ff" : "99");
    ctx.lineWidth = isHover ? 2 : 1.5;
    if (n.isExternal) ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Label
    const labelY = n.y + r + 13;
    ctx.font = `${isHover ? 600 : 500} 11px system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = isHover ? "#EDF2F7" : "#A0B0C8";
    ctx.fillText(n.name.length > 14 ? n.name.slice(0, 13) + "…" : n.name, n.x, labelY);

    // Initials inside node
    ctx.font = `700 ${n.isExternal ? 10 : 12}px system-ui`;
    ctx.fillStyle = color;
    ctx.textBaseline = "middle";
    const initials = n.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    ctx.fillText(initials, n.x, n.y);
  }

  ctx.restore();
}

// ─── Component ───────────────────────────────────────────

export function DependencyGraph({ apps, dependencies }: { apps: AppNode[]; dependencies: Dependency[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    nodes: SimNode[];
    edges: SimEdge[];
    transform: { x: number; y: number; scale: number };
    hoverId: string | null;
    dragId: string | null;
    dragOffX: number;
    dragOffY: number;
    panStart: { x: number; y: number; tx: number; ty: number } | null;
    animId: number;
    running: boolean;
  }>({
    nodes: [], edges: [],
    transform: { x: 0, y: 0, scale: 1 },
    hoverId: null, dragId: null, dragOffX: 0, dragOffY: 0,
    panStart: null, animId: 0, running: true,
  });

  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: SimNode } | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const router = useRouter();

  // ── Initialize graph ──
  useEffect(() => {
    const { nodes, edges } = buildGraph(apps, dependencies);
    stateRef.current.nodes = nodes;
    stateRef.current.edges = edges;
  }, [apps, dependencies]);

  // ── Canvas sizing ──
  const sizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = parent.clientWidth * dpr;
    canvas.height = parent.clientHeight * dpr;
    canvas.style.width = parent.clientWidth + "px";
    canvas.style.height = parent.clientHeight + "px";
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    // Center the transform on first load
    const s = stateRef.current;
    if (s.transform.x === 0 && s.transform.y === 0) {
      s.transform.x = parent.clientWidth / 2;
      s.transform.y = parent.clientHeight / 2;
    }
  }, []);

  // ── Animation loop ──
  useEffect(() => {
    sizeCanvas();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const s = stateRef.current;

    const loop = () => {
      if (!s.running) return;
      const ctx = canvas.getContext("2d")!;
      const dpr = window.devicePixelRatio || 1;
      // Adjust for DPR in ctx (already scaled by sizeCanvas)
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      for (let i = 0; i < SIM_STEPS; i++) {
        simulate(s.nodes, s.edges, 0, 0);
      }
      draw(ctx, s.nodes, s.edges, s.transform, s.hoverId);
      s.animId = requestAnimationFrame(loop);
    };
    s.animId = requestAnimationFrame(loop);

    const ro = new ResizeObserver(sizeCanvas);
    ro.observe(canvas.parentElement!);

    return () => {
      s.running = false;
      cancelAnimationFrame(s.animId);
      ro.disconnect();
    };
  }, [sizeCanvas]);

  // ── Canvas → world coords ──
  const toWorld = (cx: number, cy: number, rect: DOMRect) => {
    const s = stateRef.current;
    const dpr = window.devicePixelRatio || 1;
    const px = (cx - rect.left);
    const py = (cy - rect.top);
    return {
      x: (px - s.transform.x) / s.transform.scale,
      y: (py - s.transform.y) / s.transform.scale,
    };
  };

  const hitTest = (wx: number, wy: number): SimNode | null => {
    for (const n of stateRef.current.nodes) {
      const r = n.isExternal ? EXT_RADIUS : NODE_RADIUS;
      const dx = wx - n.x, dy = wy - n.y;
      if (dx * dx + dy * dy < r * r) return n;
    }
    return null;
  };

  // ── Mouse handlers ──
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const s = stateRef.current;
    const { x: wx, y: wy } = toWorld(e.clientX, e.clientY, rect);

    if (s.dragId) {
      const n = s.nodes.find((n) => n.id === s.dragId);
      if (n) { n.x = wx + s.dragOffX; n.y = wy + s.dragOffY; n.pinned = true; n.vx = 0; n.vy = 0; }
      return;
    }
    if (s.panStart) {
      const dx = e.clientX - s.panStart.x;
      const dy = e.clientY - s.panStart.y;
      s.transform.x = s.panStart.tx + dx;
      s.transform.y = s.panStart.ty + dy;
      canvas.style.cursor = "grabbing";
      return;
    }

    const hit = hitTest(wx, wy);
    s.hoverId = hit?.id ?? null;
    canvas.style.cursor = hit ? "pointer" : "grab";
    if (hit) {
      setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, node: hit });
    } else {
      setTooltip(null);
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const s = stateRef.current;
    const { x: wx, y: wy } = toWorld(e.clientX, e.clientY, rect);
    const hit = hitTest(wx, wy);
    if (hit) {
      s.dragId = hit.id;
      s.dragOffX = hit.x - wx;
      s.dragOffY = hit.y - wy;
    } else {
      s.panStart = { x: e.clientX, y: e.clientY, tx: s.transform.x, ty: s.transform.y };
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    const s = stateRef.current;
    if (s.dragId) {
      const n = s.nodes.find((n) => n.id === s.dragId);
      if (n) n.pinned = false;
      s.dragId = null;
    }
    s.panStart = null;
    if (canvasRef.current) canvasRef.current.style.cursor = "grab";
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const { x: wx, y: wy } = toWorld(e.clientX, e.clientY, rect);
    const hit = hitTest(wx, wy);
    if (hit?.slug) router.push(`/apps/${hit.slug}`);
  }, [router]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const s = stateRef.current;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    s.transform.x = px + (s.transform.x - px) * factor;
    s.transform.y = py + (s.transform.y - py) * factor;
    s.transform.scale = Math.min(4, Math.max(0.2, s.transform.scale * factor));
  }, []);

  const zoom = (delta: number) => {
    const s = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.clientWidth / 2, cy = canvas.clientHeight / 2;
    const factor = delta > 0 ? 1.2 : 0.8;
    s.transform.x = cx + (s.transform.x - cx) * factor;
    s.transform.y = cy + (s.transform.y - cy) * factor;
    s.transform.scale = Math.min(4, Math.max(0.2, s.transform.scale * factor));
  };

  const fitToScreen = () => {
    const s = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas || s.nodes.length === 0) return;
    const xs = s.nodes.map((n) => n.x), ys = s.nodes.map((n) => n.y);
    const minX = Math.min(...xs) - 60, maxX = Math.max(...xs) + 60;
    const minY = Math.min(...ys) - 60, maxY = Math.max(...ys) + 60;
    const graphW = maxX - minX, graphH = maxY - minY;
    const scale = Math.min(4, Math.max(0.2, Math.min(canvas.clientWidth / graphW, canvas.clientHeight / graphH) * 0.9));
    s.transform.scale = scale;
    s.transform.x = canvas.clientWidth / 2 - ((minX + graphW / 2) * scale);
    s.transform.y = canvas.clientHeight / 2 - ((minY + graphH / 2) * scale);
  };

  const reset = () => {
    const { nodes, edges } = buildGraph(apps, dependencies);
    stateRef.current.nodes = nodes;
    stateRef.current.edges = edges;
    stateRef.current.transform = { x: canvasRef.current!.clientWidth / 2, y: canvasRef.current!.clientHeight / 2, scale: 1 };
  };

  // ── Filtered node count ──
  const visibleCount = filterStatus === "ALL"
    ? stateRef.current.nodes.filter((n) => !n.isExternal).length
    : stateRef.current.nodes.filter((n) => !n.isExternal && n.status === filterStatus).length;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#0B1220", overflow: "hidden" }}>
      <canvas
        ref={canvasRef}
        style={{ display: "block", cursor: "grab" }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
      />

      {/* Controls */}
      <div style={{
        position: "absolute", top: 12, right: 12,
        display: "flex", flexDirection: "column", gap: 4,
      }}>
        {[
          { icon: <ZoomIn size={13} />, action: () => zoom(1), title: "Zoom in" },
          { icon: <ZoomOut size={13} />, action: () => zoom(-1), title: "Zoom out" },
          { icon: <Maximize2 size={13} />, action: fitToScreen, title: "Fit to screen" },
          { icon: <RotateCcw size={13} />, action: reset, title: "Zurücksetzen" },
        ].map(({ icon, action, title }) => (
          <button
            key={title}
            onClick={action}
            title={title}
            style={{
              width: 30, height: 30, borderRadius: 6,
              background: "#111C2D", border: "1px solid #1E3050",
              color: "#7A8BA6", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {icon}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 4, flexWrap: "wrap" }}>
        {["ALL", "PRODUCTION", "DEVELOPMENT", "TESTING", "MAINTENANCE", "ARCHIVED"].map((s) => {
          const color = STATUS_COLOR[s] ?? "#7A8BA6";
          const active = filterStatus === s;
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                padding: "3px 10px", borderRadius: 99, fontSize: 10, fontWeight: 600,
                background: active ? (s === "ALL" ? "#2563E8" : color) + "33" : "#111C2D",
                border: `1px solid ${active ? (s === "ALL" ? "#2563E8" : color) : "#1E3050"}`,
                color: active ? (s === "ALL" ? "#2563E8" : color) : "#7A8BA6",
                cursor: "pointer", letterSpacing: ".06em",
                textTransform: s === "ALL" ? "none" : "uppercase",
              }}
            >
              {s === "ALL" ? "Alle" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{
        position: "absolute", bottom: 12, left: 12,
        background: "#111C2D", border: "1px solid #1E3050", borderRadius: 8, padding: "8px 12px",
        display: "flex", flexDirection: "column", gap: 4,
      }}>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#7A8BA6", margin: "0 0 4px" }}>Verbindungstyp</p>
        {Object.entries(REL_LABEL).map(([type, label]) => (
          <div key={type} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ display: "block", width: 20, height: 2, background: REL_COLOR[type] ?? "#7A8BA6", borderRadius: 1 }} />
            <span style={{ fontSize: 10, color: "#7A8BA6" }}>{label}</span>
          </div>
        ))}
        <div style={{ borderTop: "1px solid #1E3050", marginTop: 4, paddingTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ display: "block", width: 20, height: 2, background: "#6B7280", borderRadius: 1, borderTop: "2px dashed #6B7280", borderBottom: "none" }} />
          <span style={{ fontSize: 10, color: "#7A8BA6" }}>geplant</span>
        </div>
        <div style={{ borderTop: "1px solid #1E3050", marginTop: 4, paddingTop: 4 }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#7A8BA6", margin: "0 0 4px" }}>Hinweis</p>
          <p style={{ fontSize: 9, color: "#4A5568", margin: 0, lineHeight: 1.5 }}>Ziehen = Node bewegen<br />Scrollen = Zoom<br />Klick = App öffnen</p>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: "absolute",
          left: tooltip.x + 14,
          top: tooltip.y - 10,
          background: "#111C2D",
          border: "1px solid #1E3050",
          borderRadius: 8,
          padding: "8px 12px",
          pointerEvents: "none",
          zIndex: 10,
          minWidth: 160,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
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
