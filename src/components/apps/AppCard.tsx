import Link from "next/link";
import { ExternalLink, AlertTriangle, WifiOff } from "lucide-react";
import { AppStatusBadge, type AppStatus } from "./AppStatusBadge";
import { AppLogo } from "./AppLogo";

const STATUS_COLOR: Record<string, string> = {
  PRODUCTION:  "#10B981",
  DEVELOPMENT: "#3B82F6",
  TESTING:     "#F59E0B",
  MAINTENANCE: "#F97316",
  ARCHIVED:    "#6B7280",
};

const HEALTH_COLOR: Record<string, string> = {
  UP: "#10B981", DEGRADED: "#F59E0B", DOWN: "#EF4444", UNKNOWN: "#7A8BA6",
};
const HEALTH_LABEL: Record<string, string> = {
  UP: "Online", DEGRADED: "Degraded", DOWN: "Offline", UNKNOWN: "Unbekannt",
};

interface AppCardProps {
  app: {
    name: string;
    slug: string;
    shortDesc: string;
    status: AppStatus;
    logoUrl?: string | null;
    urlProd?: string | null;
    categories?: Array<{ category: { name: string; color: string } }>;
    deploymentTarget?: { id: string; name: string; status: string } | null;
  };
  healthStatus?: string | null;
}

export function AppCard({ app, healthStatus }: AppCardProps) {
  const accentColor = STATUS_COLOR[app.status] ?? "#6B7280";
  const targetStatus = app.deploymentTarget?.status;
  const targetWarning = targetStatus === "MAINTENANCE" || targetStatus === "OFFLINE";

  return (
    <Link href={`/apps/${app.slug}`} style={{ textDecoration: "none", display: "block" }}>
      <div
        className="ds-appcard"
        style={{
          position: "relative",
          background: "#111C2D",
          border: `1px solid ${targetWarning ? (targetStatus === "OFFLINE" ? "#EF444440" : "#F9731640") : "#1E3050"}`,
          borderRadius: 12,
          overflow: "hidden",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          transition: "border-color 200ms, box-shadow 200ms",
        }}
      >
        {/* Status-Akzentstreifen */}
        <div style={{ height: 3, width: "100%", flexShrink: 0, background: accentColor }} />

        {/* Target-Warnung */}
        {targetWarning && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "5px 12px", fontSize: 11, fontWeight: 500,
            background: targetStatus === "OFFLINE" ? "rgba(239,68,68,0.1)" : "rgba(249,115,22,0.1)",
            color: targetStatus === "OFFLINE" ? "#EF4444" : "#F97316",
            borderBottom: `1px solid ${targetStatus === "OFFLINE" ? "#EF444430" : "#F9731630"}`,
          }}>
            {targetStatus === "OFFLINE"
              ? <WifiOff size={10} />
              : <AlertTriangle size={10} />}
            {app.deploymentTarget!.name} — {targetStatus === "OFFLINE" ? "Offline" : "In Wartung"}
          </div>
        )}

        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <AppLogo
              logoUrl={app.logoUrl}
              urlProd={app.urlProd}
              name={app.name}
              accentColor={accentColor}
              size={44}
              borderRadius={10}
            />
            <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#EDF2F7", margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {app.name}
              </p>
              {app.urlProd ? (
                <span style={{ fontSize: 11, color: "#7A8BA6", display: "flex", alignItems: "center", gap: 4 }}>
                  <ExternalLink size={9} />
                  {app.urlProd.replace(/^https?:\/\//, "")}
                </span>
              ) : (
                <span style={{ fontSize: 11, color: "#4A5A72" }}>keine URL</span>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, paddingTop: 2 }}>
              <AppStatusBadge status={app.status} showDot />
              {healthStatus && (
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: HEALTH_COLOR[healthStatus] ?? "#7A8BA6" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: HEALTH_COLOR[healthStatus] ?? "#7A8BA6", boxShadow: healthStatus === "UP" ? `0 0 5px ${HEALTH_COLOR[healthStatus]}` : undefined, display: "inline-block", flexShrink: 0 }} />
                  {HEALTH_LABEL[healthStatus] ?? healthStatus}
                </span>
              )}
            </div>
          </div>

          {/* Beschreibung */}
          <p style={{ fontSize: 13, color: "#7A8BA6", lineHeight: 1.55, margin: 0, flex: 1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {app.shortDesc || "Keine Beschreibung"}
          </p>

          {/* Kategorien */}
          {app.categories && app.categories.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, paddingTop: 10, borderTop: "1px solid rgba(30,48,80,0.7)" }}>
              {app.categories.slice(0, 3).map(({ category }) => (
                <span key={category.name} style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 500, color: category.color, background: `${category.color}22` }}>
                  {category.name}
                </span>
              ))}
              {app.categories.length > 3 && (
                <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, color: "#7A8BA6", background: "#1A2640" }}>
                  +{app.categories.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
