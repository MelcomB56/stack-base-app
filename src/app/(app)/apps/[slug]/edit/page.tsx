import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { EditAppForm } from "@/components/apps/EditAppForm";

type Props = { params: Promise<{ slug: string }> };

export default async function EditAppPage({ params }: Props) {
  const { slug } = await params;

  const [app, categories, stacks, technologies, tags, targets] = await Promise.all([
    db.app.findFirst({
      where: { slug, deletedAt: null },
      select: {
        slug:               true,
        name:               true,
        shortDesc:          true,
        status:             true,
        language:           true,
        urlProd:            true,
        urlStaging:         true,
        logoUrl:            true,
        repoUrl:            true,
        dockerImage:        true,
        agentUrl:           true,
        agentToken:         true,
        dbType:             true,
        contactName:        true,
        supportEmail:       true,
        criticality:        true,
        vendor:             true,
        githubToken:        true,
        deploymentTargetId: true,
        runtimeType:        true,
        hostPort:           true,
        containerPort:      true,
        categories:         { select: { categoryId: true } },
        tags:               { select: { tagId: true } },
        stacks:             { select: { stackId: true } },
        technologies:       { select: { technologyId: true } },
      },
    }),
    db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    db.stack.findMany({ orderBy: { name: "asc" } }),
    db.technology.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
    db.tag.findMany({ orderBy: { name: "asc" } }),
    db.deploymentTarget.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!app) notFound();

  return (
    <EditAppForm
      app={{
        ...app,
        logoUrl:            app.logoUrl            ?? null,
        agentUrl:           app.agentUrl           ?? null,
        agentToken:         app.agentToken         ?? null,
        criticality:        app.criticality        ?? null,
        vendor:             app.vendor             ?? null,
        githubToken:        app.githubToken        ?? null,
        deploymentTargetId: app.deploymentTargetId ?? null,
        runtimeType:        app.runtimeType        ?? null,
        hostPort:           app.hostPort           ?? null,
        containerPort:      app.containerPort      ?? null,
        categoryIds:        app.categories.map((c) => c.categoryId),
        tagIds:             app.tags.map((t) => t.tagId),
        stackIds:           app.stacks.map((s) => s.stackId),
        technologyIds:      app.technologies.map((t) => t.technologyId),
      }}
      options={{ categories, stacks, technologies, tags, targets }}
    />
  );
}
