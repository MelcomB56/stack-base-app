import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Nur authConfig (Edge-safe, kein DB-Import) für die Middleware verwenden
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$|.*\\.ico$|.*\\.webmanifest$|manifest\\.json$).*)"],
};
