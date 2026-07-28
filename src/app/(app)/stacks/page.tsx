import { db } from "@/lib/db";
import { Layers, Grid2X2, Cpu } from "lucide-react";
import Link from "next/link";

export default async function StacksPage() {
  const stacks = await db.stack.findMany({
    include: {
      _count: { select: { apps: true } },
      technologies: {
        include: { technology: true },
        take: 5,
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Layers size={18} className="text-primary" />
          Stacks
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {stacks.length} Tech-Stack{stacks.length !== 1 ? "s" : ""} definiert
        </p>
      </div>

      {stacks.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Noch keine Stacks angelegt.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stacks.map((stack) => (
            <div
              key={stack.id}
              className="rounded-xl border border-border bg-card p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                    <Layers size={15} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{stack.name}</p>
                    {stack.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{stack.description}</p>
                    )}
                  </div>
                </div>
                <Link
                  href={`/apps?stackId=${stack.id}`}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors shrink-0"
                >
                  <Grid2X2 size={11} />
                  <span className="tabular-nums">{stack._count.apps} Apps</span>
                </Link>
              </div>

              {stack.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/40">
                  {stack.technologies.map(({ technology }) => (
                    <span
                      key={technology.id}
                      className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-muted text-muted-foreground"
                    >
                      <Cpu size={9} />
                      {technology.name}
                    </span>
                  ))}
                  {stack._count.apps > 5 && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-muted text-muted-foreground">
                      +{stack._count.apps - 5} weitere
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
