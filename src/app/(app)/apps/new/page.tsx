"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";

const STATUS_OPTIONS = [
  { value: "DEVELOPMENT", label: "Entwicklung" },
  { value: "TESTING", label: "Testing" },
  { value: "PRODUCTION", label: "Produktion" },
  { value: "MAINTENANCE", label: "Wartung" },
  { value: "ARCHIVED", label: "Archiviert" },
];

export default function NewAppPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
      const res = await fetch("/api/apps", {
        method: "POST",
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

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/apps">
          <Button size="sm" variant="ghost" className="gap-1.5">
            <ArrowLeft size={14} />
            Zurück
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Neue App anlegen</h1>
          <p className="text-sm text-muted-foreground">Grunddaten der App erfassen</p>
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
                  placeholder="z.B. AzubiSuite"
                  maxLength={100}
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="shortDesc">Kurzbeschreibung *</Label>
                <Input
                  id="shortDesc"
                  name="shortDesc"
                  required
                  placeholder="Was macht diese App? (max. 255 Zeichen)"
                  maxLength={255}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue="DEVELOPMENT"
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
                  placeholder="z.B. Next.js, Laravel"
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
                placeholder="https://app.example.de"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="urlStaging">Staging</Label>
              <Input
                id="urlStaging"
                name="urlStaging"
                type="url"
                placeholder="https://staging.example.de"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="repoUrl">Repository</Label>
              <Input
                id="repoUrl"
                name="repoUrl"
                type="url"
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
                  placeholder="org/image:latest"
                  maxLength={200}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dbType">Datenbank</Label>
                <Input
                  id="dbType"
                  name="dbType"
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
                <Input id="contactName" name="contactName" placeholder="Name" maxLength={100} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="supportEmail">Support E-Mail</Label>
                <Input
                  id="supportEmail"
                  name="supportEmail"
                  type="email"
                  placeholder="support@example.de"
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

        <div className="flex gap-2 justify-end">
          <Link href="/apps">
            <Button type="button" variant="ghost">
              Abbrechen
            </Button>
          </Link>
          <Button type="submit" disabled={loading} className="gap-1.5">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            App anlegen
          </Button>
        </div>
      </form>
    </div>
  );
}
