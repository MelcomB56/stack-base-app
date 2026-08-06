import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Authentik from "next-auth/providers/authentik";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { authConfig } from "@/auth.config";

// SSO-Konfig einmalig beim Start aus DB laden (top-level await, läuft serverseitig)
const ssoRows = await db.systemSetting
  .findMany({
    where: {
      key: { in: ["authentik_enabled", "authentik_client_id", "authentik_client_secret", "authentik_issuer", "authentik_default_role"] },
    },
  })
  .catch(() => []);

const ssoMap = Object.fromEntries(ssoRows.map((r) => [r.key, r.value]));

const ssoActive =
  ssoMap.authentik_enabled === "true" &&
  !!ssoMap.authentik_client_id &&
  !!ssoMap.authentik_client_secret &&
  !!ssoMap.authentik_issuer;

// Env-Vars als Fallback wenn DB-Konfig nicht vorhanden
const authentikProviders =
  ssoActive
    ? [Authentik({ clientId: ssoMap.authentik_client_id, clientSecret: ssoMap.authentik_client_secret, issuer: ssoMap.authentik_issuer })]
    : process.env.AUTHENTIK_CLIENT_ID
    ? [Authentik({ clientId: process.env.AUTHENTIK_CLIENT_ID!, clientSecret: process.env.AUTHENTIK_CLIENT_SECRET!, issuer: process.env.AUTHENTIK_ISSUER })]
    : [];

const defaultSsoRole = (ssoMap.authentik_default_role as string | undefined) ?? "GUEST";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "E-Mail & Passwort",
      credentials: {
        email:    { label: "E-Mail",    type: "email" },
        password: { label: "Passwort",  type: "password" },
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
    ...authentikProviders,
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, account, profile, trigger, session: updateData }) {
      // ── Authentik SSO-Login ───────────────────────────────────────────────
      if (account?.provider === "authentik" && profile) {
        const email = (profile.email as string | undefined) ?? "";
        if (email) {
          let dbUser = await db.user.findUnique({ where: { email } });
          if (!dbUser) {
            dbUser = await db.user.create({
              data: {
                email,
                name:
                  (profile.name as string | undefined) ??
                  (profile.preferred_username as string | undefined) ??
                  email.split("@")[0],
                role: defaultSsoRole as never, // Prisma-Enum-Cast
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
        const dbUser = await db.user.findUnique({ where: { id: user.id as string }, select: { avatarUrl: true } });
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
