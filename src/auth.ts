import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Authentik from "next-auth/providers/authentik";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { authConfig } from "@/auth.config";

// ─── Live-SSO-Konfiguration ────────────────────────────────────────────────
// Wird beim Modulstart und alle 60 s aus der DB gelesen.
// Kein Neustart nötig — Änderungen greifen innerhalb einer Minute.

const live = {
  // Direkt aus Env-Vars initialisiert — refreshSSO() überschreibt dann mit DB-Wert.
  // So ist live.enabled korrekt auch beim allerersten Request (lazy module load).
  enabled:      !!(process.env.AUTHENTIK_CLIENT_ID && process.env.AUTHENTIK_CLIENT_SECRET && process.env.AUTHENTIK_ISSUER),
  clientId:     process.env.AUTHENTIK_CLIENT_ID     ?? "",
  clientSecret: process.env.AUTHENTIK_CLIENT_SECRET ?? "",
  issuer:       process.env.AUTHENTIK_ISSUER        ?? "https://localhost",
  defaultRole:  "GUEST",
};

async function refreshSSO() {
  try {
    const rows = await db.systemSetting.findMany({
      where: {
        key: {
          in: [
            "authentik_enabled", "authentik_client_id",
            "authentik_client_secret", "authentik_issuer",
            "authentik_default_role",
          ],
        },
      },
    });
    const m = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    live.enabled =
      m.authentik_enabled === "true" &&
      !!m.authentik_client_id &&
      !!m.authentik_client_secret &&
      !!m.authentik_issuer;
    if (m.authentik_client_id)     live.clientId     = m.authentik_client_id;
    if (m.authentik_client_secret) live.clientSecret = m.authentik_client_secret;
    if (m.authentik_issuer)        live.issuer       = m.authentik_issuer;
    if (m.authentik_default_role)  live.defaultRole  = m.authentik_default_role;
  } catch {
    // DB noch nicht bereit — vorherige Werte behalten
  }
}

void refreshSSO();
const _timer = setInterval(refreshSSO, 60_000);
// In Node.js: Timer soll den Prozess nicht am Leben halten
if (typeof _timer === "object" && typeof (_timer as NodeJS.Timeout).unref === "function") {
  (_timer as NodeJS.Timeout).unref();
}

// next-auth ruft Provider-Funktionen in parseProviders per Request auf:
//   typeof p === "function" ? p() : p
// So wird der Provider mit den aktuellen live-Werten gebaut — keine Getter-Hackery nötig.
// Wenn SSO inaktiv: fester authorization-Stub → Server macht kein OIDC-Discovery-Fetch.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildAuthentikProvider(): any {
  if (live.enabled) {
    return Authentik({
      clientId:     live.clientId,
      clientSecret: live.clientSecret,
      issuer:       live.issuer,
      // Authentik erwartet Credentials im Request-Body, nicht als Basic-Auth-Header
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      client: { token_endpoint_auth_method: "client_secret_post" } as any,
    });
  }
  // Inaktiv: authorization-String verhindert Discovery-Fetch; clientId/Secret sind Platzhalter.
  return Authentik({
    clientId:     "_",
    clientSecret: "_",
    issuer:       "https://sso.example.com/",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    authorization: "https://sso.example.com/authorize" as any,
  });
}

// ─── NextAuth ──────────────────────────────────────────────────────────────

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "E-Mail & Passwort",
      credentials: {
        email:    { label: "E-Mail",   type: "email" },
        password: { label: "Passwort", type: "password" },
      },
      async authorize(credentials) {
        const email    = credentials?.email    as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
    buildAuthentikProvider,
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ account }) {
      // SSO-Login blockieren wenn in DB deaktiviert
      if (account?.provider === "authentik" && !live.enabled) return false;
      return true;
    },

    async jwt({ token, user, account, profile, trigger, session: updateData }) {
      // ── Authentik-Login ───────────────────────────────────────────────────
      if (account?.provider === "authentik" && profile) {
        const email = (profile.email as string | undefined) ?? "";
        if (email) {
          let dbUser = await db.user.findUnique({ where: { email } });
          if (!dbUser) {
            dbUser = await db.user.create({
              data: {
                email,
                name:
                  (profile.name              as string | undefined) ??
                  (profile.preferred_username as string | undefined) ??
                  email.split("@")[0],
                role: live.defaultRole as never,
                lastLoginAt: new Date(),
              },
            });
          } else {
            await db.user.update({ where: { id: dbUser.id }, data: { lastLoginAt: new Date() } });
          }
          token.id      = dbUser.id;
          token.role    = dbUser.role;
          token.picture = dbUser.avatarUrl ?? null;
          token.email   = dbUser.email;
          token.name    = dbUser.name;
        }
      }

      // ── Credentials-Login ─────────────────────────────────────────────────
      if (user && account?.provider === "credentials") {
        token.id   = user.id;
        token.role = (user as { role?: string }).role ?? "GUEST";
        const dbUser = await db.user.findUnique({
          where: { id: user.id as string },
          select: { avatarUrl: true },
        });
        token.picture = dbUser?.avatarUrl ?? null;
      }

      // ── Session-Update (Avatar etc.) ──────────────────────────────────────
      if (trigger === "update" && updateData?.image !== undefined) {
        token.picture = updateData.image;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id    = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        session.user.image = (token.picture as string | null) ?? null;
      }
      return session;
    },
  },
});
