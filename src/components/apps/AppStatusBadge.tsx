import { cn } from "@/lib/utils";

export type AppStatus = "PRODUCTION" | "DEVELOPMENT" | "TESTING" | "MAINTENANCE" | "ARCHIVED";

const CONFIG: Record<AppStatus, { label: string; className: string; dot: string }> = {
  PRODUCTION: {
    label: "Produktion",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    dot: "bg-emerald-400",
  },
  DEVELOPMENT: {
    label: "Entwicklung",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    dot: "bg-blue-400",
  },
  TESTING: {
    label: "Testing",
    className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    dot: "bg-yellow-400",
  },
  MAINTENANCE: {
    label: "Wartung",
    className: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    dot: "bg-orange-400",
  },
  ARCHIVED: {
    label: "Archiviert",
    className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
    dot: "bg-zinc-400",
  },
};

interface Props {
  status: AppStatus;
  showDot?: boolean;
  className?: string;
}

export function AppStatusBadge({ status, showDot = true, className }: Props) {
  const cfg = CONFIG[status] ?? CONFIG.DEVELOPMENT;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
        cfg.className,
        className
      )}
    >
      {showDot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />}
      {cfg.label}
    </span>
  );
}
