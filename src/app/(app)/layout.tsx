import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { PermissionsProvider } from "@/lib/permissions-context";
import { auth } from "@/auth";
import { getUserPermissions } from "@/lib/rbac";

// Alle Seiten dieser App-Gruppe erfordern Auth + DB — nie statisch prerendern
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  let allowedPerms: string[] = [];
  if (session?.user?.id) {
    const role = (session.user as { role?: string }).role;
    if (role === "SUPER_ADMIN" || role === "ADMIN") {
      allowedPerms = ["*"];
    } else {
      const perms = await getUserPermissions(session.user.id);
      allowedPerms = [...perms];
    }
  }

  return (
    <PermissionsProvider allowedPerms={allowedPerms}>
      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <Sidebar allowedPerms={allowedPerms} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
          <Topbar />
          <main style={{ flex: 1, overflowY: "auto", position: "relative" }}>
            {children}
          </main>
        </div>
      </div>
    </PermissionsProvider>
  );
}
