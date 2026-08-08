export type Action = "create" | "read" | "update" | "delete";

export interface PermissionGroup {
  resource: string;
  label: string;
  /** Which actions exist for this resource (not all resources have all 4) */
  actions: Partial<Record<Action, string>>;
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  // ── App-Kern ──────────────────────────────────────────────────────────────
  {
    resource: "apps",
    label: "Apps",
    actions: {
      create: "App anlegen",
      read:   "Apps anzeigen",
      update: "App bearbeiten",
      delete: "App löschen",
    },
  },
  {
    resource: "app_releases",
    label: "Releases",
    actions: {
      create: "Release anlegen",
      read:   "Releases anzeigen",
      update: "Release bearbeiten",
      delete: "Release löschen",
    },
  },
  {
    resource: "app_changelog",
    label: "Changelog",
    actions: {
      create: "Eintrag anlegen",
      read:   "Changelog anzeigen",
      update: "Eintrag bearbeiten",
      delete: "Eintrag löschen",
    },
  },
  {
    resource: "app_docs",
    label: "App-Dokumentation",
    actions: {
      create: "Seite anlegen",
      read:   "Docs anzeigen",
      update: "Seite bearbeiten",
      delete: "Seite löschen",
    },
  },
  {
    resource: "app_wiki",
    label: "App-Wiki",
    actions: {
      read:   "Wiki anzeigen",
      update: "Wiki bearbeiten",
    },
  },
  {
    resource: "app_screenshots",
    label: "Screenshots",
    actions: {
      create: "Screenshot hochladen",
      read:   "Screenshots anzeigen",
      delete: "Screenshot löschen",
    },
  },
  // ── Betrieb ───────────────────────────────────────────────────────────────
  {
    resource: "app_incidents",
    label: "Incidents",
    actions: {
      create: "Incident melden",
      read:   "Incidents anzeigen",
      update: "Incident bearbeiten",
      delete: "Incident löschen",
    },
  },
  {
    resource: "app_environments",
    label: "Environments",
    actions: {
      create: "Environment anlegen",
      read:   "Environments anzeigen",
      update: "Environment bearbeiten",
      delete: "Environment löschen",
    },
  },
  {
    resource: "app_monitoring",
    label: "Monitoring & Healthchecks",
    actions: {
      create: "Monitor anlegen",
      read:   "Monitoring anzeigen",
      update: "Monitor bearbeiten",
      delete: "Monitor löschen",
    },
  },
  {
    resource: "app_dependencies",
    label: "Abhängigkeiten",
    actions: {
      create: "Abhängigkeit anlegen",
      read:   "Abhängigkeiten anzeigen",
      update: "Abhängigkeit bearbeiten",
      delete: "Abhängigkeit löschen",
    },
  },
  {
    resource: "app_costs",
    label: "Kostenerfassung",
    actions: {
      create: "Kosten eintragen",
      read:   "Kosten anzeigen",
      update: "Kosten bearbeiten",
      delete: "Kosten löschen",
    },
  },
  {
    resource: "app_certs",
    label: "Zertifikate",
    actions: {
      read:   "Zertifikate anzeigen",
      update: "Zertifikat-Check auslösen",
    },
  },
  {
    resource: "app_github",
    label: "GitHub-Integration",
    actions: {
      update: "GitHub-Sync ausführen",
    },
  },
  // ── Plattform ─────────────────────────────────────────────────────────────
  {
    resource: "platform_docs",
    label: "Plattform-Dokumentation",
    actions: {
      create: "Dokument anlegen",
      read:   "Dokumentation anzeigen",
      update: "Dokument bearbeiten",
      delete: "Dokument löschen",
    },
  },
  {
    resource: "categories",
    label: "Kategorien",
    actions: {
      create: "Kategorie anlegen",
      read:   "Kategorien anzeigen",
      update: "Kategorie bearbeiten",
      delete: "Kategorie löschen",
    },
  },
  {
    resource: "tags",
    label: "Tags",
    actions: {
      create: "Tag anlegen",
      read:   "Tags anzeigen",
      update: "Tag bearbeiten",
      delete: "Tag löschen",
    },
  },
  {
    resource: "stacks",
    label: "Tech-Stacks",
    actions: {
      create: "Stack anlegen",
      read:   "Stacks anzeigen",
      update: "Stack bearbeiten",
      delete: "Stack löschen",
    },
  },
  {
    resource: "technologies",
    label: "Technologien",
    actions: {
      create: "Technologie anlegen",
      read:   "Technologien anzeigen",
      update: "Technologie bearbeiten",
      delete: "Technologie löschen",
    },
  },
  {
    resource: "targets",
    label: "Deployment-Targets",
    actions: {
      create: "Target anlegen",
      read:   "Targets anzeigen",
      update: "Target bearbeiten",
      delete: "Target löschen",
    },
  },
  {
    resource: "announcements",
    label: "Ankündigungen",
    actions: {
      create: "Ankündigung erstellen",
      read:   "Ankündigungen anzeigen",
      update: "Ankündigung bearbeiten",
      delete: "Ankündigung löschen",
    },
  },
  // ── Administration ────────────────────────────────────────────────────────
  {
    resource: "users",
    label: "Nutzerverwaltung",
    actions: {
      create: "Nutzer anlegen",
      read:   "Nutzer anzeigen",
      update: "Nutzer bearbeiten",
      delete: "Nutzer löschen",
    },
  },
  {
    resource: "roles",
    label: "Rollenverwaltung",
    actions: {
      create: "Rolle anlegen",
      read:   "Rollen anzeigen",
      update: "Rolle bearbeiten",
      delete: "Rolle löschen",
    },
  },
  {
    resource: "settings",
    label: "Systemeinstellungen",
    actions: {
      read:   "Einstellungen anzeigen",
      update: "Einstellungen bearbeiten",
    },
  },
  {
    resource: "activity_log",
    label: "Aktivitätsprotokoll",
    actions: {
      read: "Aktivitätslog anzeigen",
    },
  },
];

/** Flat map permissionId → label */
export const ALL_PERMISSIONS: Record<string, string> = {};
for (const g of PERMISSION_GROUPS) {
  for (const [action, label] of Object.entries(g.actions)) {
    ALL_PERMISSIONS[`${g.resource}.${action}`] = label as string;
  }
}

export const ACTION_ORDER: Action[] = ["create", "read", "update", "delete"];

export const ACTION_LABELS: Record<Action, string> = {
  create: "Anlegen",
  read:   "Anzeigen",
  update: "Bearbeiten",
  delete: "Löschen",
};
