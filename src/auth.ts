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
  enabled:      false,
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

// Wenn SSO aktiv (live.enabled): OIDC-Discovery via wellKnown + Issuer.
// Wenn SSO inaktiv: wellKnown + issuer = undefined → kein Discovery-Fetch.
//   authorization-Stub verhindert assertConfig-Fehler ("missing both issuer and authorization").
const _authentikProvider = Authentik({ clientId: "_", clientSecret: "_", issuer: "https://sso.example.com/" });
// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};
Object.defineProperty(_authentikProvider, "clientId",     { get: () => live.clientId || "_",                 set: noop, enumerable: true, configurable: true });
Object.defineProperty(_authentikProvider, "clientSecret", { get: () => live.clientSecret || "_",             set: noop, enumerable: true, configurable: true });
Object.defineProperty(_authentikProvider, "issuer",       { get: () => live.enabled ? live.issuer : undefined, set: noop, enumerable: true, configurable: true });
Object.defineProperty(_authentikProvider, "wellKnown",    { get: () => live.enabled ? `${live.issuer}.well-known/openid-configuration` : undefined, set: noop, enumerable: true, configurable: true });
Object.defineProperty(_authentikProvider, "authorization",{ get: () => live.enabled ? undefined : { url: "https://sso.example.com/authorize", params: {} }, set: noop, enumerable: true, configurable: true });

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
    _authentikProvider,
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
