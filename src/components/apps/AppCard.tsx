import Link from "next/link";
import { ExternalLink, Globe } from "lucide-react";
import { AppStatusBadge, type AppStatus } from "./AppStatusBadge";

const STATUS_COLOR: Record<string, string> = {
  PRODUCTION:  "#10B981",
  DEVELOPMENT: "#3B82F6",
  TESTING:     "#F59E0B",
  MAINTENANCE: "#F97316",
  ARCHIVED:    "#6B7280",
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
  };
}

export function AppCard({ app }: AppCardProps) {
  const accentColor = STATUS_COLOR[app.status] ?? "#6B7280";

  return (
    <Link href={`/apps/${app.slug}`} className="block group">
      <div className="relative rounded-xl border border-border bg-card overflow-hidden h-full flex flex-col hover:border-primary/30 hover:shadow-[0_0_0_1px_rgba(37,99,232,0.15),0_4px_20px_rgba(0,0,0,0.25)] transition-all duration-200">
        {/* Status-Akzentstreifen */}
        <div className="h-0.5 w-full shrink-0" style={{ background: accentColor }} />

        <div className="p-4 flex flex-col gap-3 flex-1">
          {/* Header */}
          <div className="flex items-start gap-3">
            {app.logoUrl ? (
              <img
                src={app.logoUrl}
                alt={app.name}
                className="w-10 h-10 rounded-lg object-contain shrink-0"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${accentColor}22` }}
              >
                <Globe size={16} style={{ color: accentColor }} />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                {app.name}
              </h3>
              {app.urlProd ? (
                <span className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                  <ExternalLink size={9} />
                  {app.urlProd.replace(/^https?:\/\//, "")}
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground/50">keine URL</span>
              )}
            </div>

            <AppStatusBadge status={app.status} showDot />
          </div>

          {/* Beschreibung */}
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-1">
            {app.shortDesc || "Keine Beschreibung"}
          </p>

          {/* Kategorien */}
          {app.categories && app.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2 border-t border-border/40">
              {app.categories.slice(0, 3).map(({ category }) => (
                <span
                  key={category.name}
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                  style={{ color: category.color, backgroundColor: `${category.color}22` }}
                >
                  {category.name}
                </span>
              ))}
              {app.categories.length > 3 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] text-muted-foreground bg-muted">
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
