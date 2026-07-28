"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Save, Trash2 } from "lucide-react";
import Link from "next/link";

const STATUS_OPTIONS = [
  { value: "DEVELOPMENT", label: "Entwicklung" },
  { value: "TESTING", label: "Testing" },
  { value: "PRODUCTION", label: "Produktion" },
  { value: "MAINTENANCE", label: "Wartung" },
  { value: "ARCHIVED", label: "Archiviert" },
];

type AppData = {
  slug: string;
  name: string;
  shortDesc: string;
  status: string;
  language: string | null;
  urlProd: string | null;
  urlStaging: string | null;
  repoUrl: string | null;
  dockerImage: string | null;
  dbType: string | null;
  contactName: string | null;
  supportEmail: string | null;
};

export function EditAppForm({ app }: { app: AppData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const body: Record<string, string> = {};
    for (const [k, v] of fd.entries()) {
      if (v !== "") body[k] = v.toString();
    }

    try {
      const res = await fetch(`/api/apps/${app.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Fehler beim Speichern");
        return;
      }
      router.push(`/apps/${data.slug}`);
      router.refresh();
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`App "${app.name}" wirklich löschen?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/apps/${app.slug}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Fehler beim Löschen");
        return;
      }
      router.push("/apps");
      router.refresh();
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/apps/${app.slug}`}>
          <Button size="sm" variant="ghost" className="gap-1.5">
            <ArrowLeft size={14} />
            Zurück
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">{app.name} bearbeiten</h1>
          <p className="text-sm text-muted-foreground">Angaben der App aktualisieren</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Basis-Informationen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  defaultValue={app.name}
                  maxLength={100}
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="shortDesc">Kurzbeschreibung *</Label>
                <Input
                  id="shortDesc"
                  name="shortDesc"
                  required
                  defaultValue={app.shortDesc}
                  maxLength={255}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue={app.status}
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="language">Sprache / Framework</Label>
                <Input
                  id="language"
                  name="language"
                  defaultValue={app.language ?? ""}
                  maxLength={50}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">URLs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="urlProd">Produktion</Label>
              <Input
                id="urlProd"
                name="urlProd"
                type="url"
                defaultValue={app.urlProd ?? ""}
                placeholder="https://app.example.de"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="urlStaging">Staging</Label>
              <Input
                id="urlStaging"
                name="urlStaging"
                type="url"
                defaultValue={app.urlStaging ?? ""}
                placeholder="https://staging.example.de"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="repoUrl">Repository</Label>
              <Input
                id="repoUrl"
                name="repoUrl"
                type="url"
                defaultValue={app.repoUrl ?? ""}
                placeholder="https://github.com/org/repo"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Infrastruktur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="dockerImage">Docker Image</Label>
                <Input
                  id="dockerImage"
                  name="dockerImage"
                  defaultValue={app.dockerImage ?? ""}
                  placeholder="org/image:latest"
                  maxLength={200}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dbType">Datenbank</Label>
                <Input
                  id="dbType"
                  name="dbType"
                  defaultValue={app.dbType ?? ""}
                  placeholder="z.B. PostgreSQL, Redis"
                  maxLength={50}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Kontakt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="contactName">Ansprechpartner</Label>
                <Input
                  id="contactName"
                  name="contactName"
                  defaultValue={app.contactName ?? ""}
                  maxLength={100}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="supportEmail">Support E-Mail</Label>
                <Input
                  id="supportEmail"
                  name="supportEmail"
                  type="email"
                  defaultValue={app.supportEmail ?? ""}
                  maxLength={200}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-2 justify-between">
          <Button
            type="button"
            variant="ghost"
            className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
            disabled={deleting || loading}
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            App löschen
          </Button>
          <div className="flex gap-2">
            <Link href={`/apps/${app.slug}`}>
              <Button type="button" variant="ghost">
                Abbrechen
              </Button>
            </Link>
            <Button type="submit" disabled={loading} className="gap-1.5">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Speichern
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
