export type AppStatus = "PRODUCTION" | "DEVELOPMENT" | "TESTING" | "MAINTENANCE" | "ARCHIVED";

const CONFIG: Record<AppStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  PRODUCTION:  { label: "Produktion",  color: "#34D399", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)", dot: "#34D399" },
  DEVELOPMENT: { label: "Entwicklung", color: "#60A5FA", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)", dot: "#60A5FA" },
  TESTING:     { label: "Testing",     color: "#FBBF24", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)", dot: "#FBBF24" },
  MAINTENANCE: { label: "Wartung",     color: "#FB923C", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.3)", dot: "#FB923C" },
  ARCHIVED:    { label: "Archiviert",  color: "#94A3B8", bg: "rgba(100,116,139,0.12)",border: "rgba(100,116,139,0.3)",dot: "#94A3B8" },
};

interface Props {
  status: AppStatus;
  showDot?: boolean;
  style?: React.CSSProperties;
}

export function AppStatusBadge({ status, showDot = true, style }: Props) {
  const cfg = CONFIG[status] ?? CONFIG.DEVELOPMENT;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 9px", borderRadius: 99,
      fontSize: 11, fontWeight: 500, whiteSpace: "nowrap",
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
      ...style,
    }}>
      {showDot && (
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      )}
      {cfg.label}
    </span>
  );
}
