import Link from "next/link";
import { ExternalLink, Globe } from "lucide-react";
import { AppStatusBadge, type AppStatus } from "./AppStatusBadge";
import { Card, CardContent } from "@/components/ui/card";

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
  return (
    <Link href={`/apps/${app.slug}`}>
      <Card className="group h-full border-border bg-card hover:border-primary/40 hover:bg-card/80 transition-all duration-200 cursor-pointer">
        <CardContent className="p-4 flex flex-col gap-3 h-full">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              {app.logoUrl ? (
                <img
                  src={app.logoUrl}
                  alt={app.name}
                  className="w-9 h-9 rounded-md object-contain"
                />
              ) : (
                <div className="w-9 h-9 rounded-md bg-primary/20 flex items-center justify-center shrink-0">
                  <Globe size={16} className="text-primary" />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                  {app.name}
                </h3>
                {app.urlProd && (
                  <span className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                    <ExternalLink size={10} />
                    {app.urlProd.replace(/^https?:\/\//, "")}
                  </span>
                )}
              </div>
            </div>
            <AppStatusBadge status={app.status} />
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-1">
            {app.shortDesc}
          </p>

          {/* Categories */}
          {app.categories && app.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-auto">
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
        </CardContent>
      </Card>
    </Link>
  );
}
