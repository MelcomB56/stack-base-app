import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/rbac";
import { ShieldCheck } from "lucide-react";
import { RolesManager } from "@/components/admin/RolesManager";
import { PERMISSION_GROUPS, ACTION_ORDER, ACTION_LABELS } from "@/lib/permissions";

export default async function AdminRolesPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!isAdmin(session)) redirect("/dashboard");

  const roles = await db.customRole.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { assignments: true } } },
  });

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#EDF2F7", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <ShieldCheck size={18} style={{ color: "#2563E8" }} />
          Rollenverwaltung
        </h1>
        <p style={{ fontSize: 13, color: "#7A8BA6", margin: "4px 0 0" }}>
          Benutzerdefinierte Rollen anlegen und Berechtigungen granular konfigurieren
        </p>
      </div>

      <RolesManager
        initialRoles={roles.map((r) => ({
          ...r,
          userCount: r._count.assignments,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        }))}
        permissionGroups={PERMISSION_GROUPS}
        actionOrder={ACTION_ORDER}
        actionLabels={ACTION_LABELS}
      />
    </div>
  );
}
