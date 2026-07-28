import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { EditAppForm } from "@/components/apps/EditAppForm";

type Props = { params: Promise<{ slug: string }> };

export default async function EditAppPage({ params }: Props) {
  const { slug } = await params;
  const app = await db.app.findFirst({
    where: { slug, deletedAt: null },
    select: {
      slug: true,
      name: true,
      shortDesc: true,
      status: true,
      language: true,
      urlProd: true,
      urlStaging: true,
      repoUrl: true,
      dockerImage: true,
      dbType: true,
      contactName: true,
      supportEmail: true,
    },
  });

  if (!app) notFound();

  return <EditAppForm app={app} />;
}
