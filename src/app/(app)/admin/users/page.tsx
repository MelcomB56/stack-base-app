import { db } from "@/lib/db";
import { Users } from "lucide-react";
import { UsersManager } from "@/components/admin/UsersManager";
import { requirePermission } from "@/lib/page-guard";

export default async function AdminUsersPage() {
  const session = await requirePermission("users.read");

  const [users, roles] = await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true, name: true, email: true, role: true,
        avatarUrl: true, lastLoginAt: true, createdAt: true,
        roleAssignments: { select: { role: { select: { id: true, name: true, color: true } } } },
      },
    }),
    db.customRole.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, color: true } }),
  ]);

  const currentRole = (session.user as { role?: string }).role ?? "GUEST";

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24, maxWidth: 1100 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#EDF2F7", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <Users size={18} style={{ color: "#2563E8" }} />
          Nutzerverwaltung
        </h1>
        <p style={{ fontSize: 13, color: "#7A8BA6", margin: "4px 0 0" }}>
          Nutzerkonten, System-Rollen und benutzerdefinierte Rollen verwalten
        </p>
      </div>

      <UsersManager
        initialUsers={users.map((u) => ({
          ...u,
          lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
          createdAt: u.createdAt.toISOString(),
          customRoles: u.roleAssignments.map((a) => a.role),
        }))}
        availableRoles={roles}
        currentUserId={session.user!.id!}
        isSuperAdmin={currentRole === "SUPER_ADMIN"}
      />
    </div>
  );
}
