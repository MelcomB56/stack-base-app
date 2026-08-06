import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ProfileClient } from "@/components/profile/ProfileClient";

export const metadata = { title: "Mein Profil – Stack-Base" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id:          true,
      name:        true,
      email:       true,
      avatarUrl:   true,
      role:        true,
      lastLoginAt: true,
      createdAt:   true,
      passwordHash: true,
    },
  });
  if (!user) redirect("/login");

  const recentActivity = await db.activityLog.findMany({
    where:   { userId: user.id },
    orderBy: { createdAt: "desc" },
    take:    10,
    select:  {
      id:         true,
      action:     true,
      entityType: true,
      createdAt:  true,
      app:        { select: { name: true, slug: true } },
    },
  });

  return (
    <ProfileClient
      user={{
        id:           user.id,
        name:         user.name,
        email:        user.email,
        avatarUrl:    user.avatarUrl ?? null,
        role:         user.role,
        lastLoginAt:  user.lastLoginAt?.toISOString() ?? null,
        createdAt:    user.createdAt.toISOString(),
        hasPassword:  !!user.passwordHash,
      }}
      activity={recentActivity.map((a) => ({
        id:         a.id,
        action:     a.action,
        entityType: a.entityType ?? null,
        createdAt:  a.createdAt.toISOString(),
        appName:    a.app?.name ?? null,
        appSlug:    a.app?.slug ?? null,
      }))}
    />
  );
}
