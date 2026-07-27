import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  // Admin-User
  const passwordHash = await bcrypt.hash("admin123", 12);
  const admin = await db.user.upsert({
    where: { email: "admin@stack-base.local" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@stack-base.local",
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });
  console.log("✅ Admin-User:", admin.email);

  // Starter-Kategorien
  const categories = [
    { name: "IT & Administration", color: "#3B82F6", icon: "Server" },
    { name: "Monitoring", color: "#10B981", icon: "Activity" },
    { name: "Entwicklung", color: "#8B5CF6", icon: "Code2" },
    { name: "Kunden", color: "#F59E0B", icon: "Users" },
    { name: "Netzwerk", color: "#06B6D4", icon: "Network" },
    { name: "Automation", color: "#EF4444", icon: "Zap" },
    { name: "Dokumentation", color: "#6B7280", icon: "BookOpen" },
    { name: "KI / Machine Learning", color: "#EC4899", icon: "Brain" },
    { name: "Private Projekte", color: "#84CC16", icon: "Home" },
    { name: "HR / Personal", color: "#F97316", icon: "UserCheck" },
  ];

  for (const cat of categories) {
    const slug = cat.name
      .toLowerCase()
      .replace(/[äöüÄÖÜ]/g, (c: string) =>
        ({ ä: "ae", ö: "oe", ü: "ue" }[c] ?? c)
      )
      .replace(/\s*\/\s*/g, "-")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    await db.category.upsert({
      where: { slug },
      update: {},
      create: { ...cat, slug },
    });
  }
  console.log(`✅ ${categories.length} Kategorien erstellt`);

  // Basis-Technologien
  const techs = [
    { name: "Next.js", category: "FRONTEND" as const },
    { name: "React", category: "FRONTEND" as const },
    { name: "TypeScript", category: "LANGUAGE" as const },
    { name: "Tailwind CSS", category: "FRONTEND" as const },
    { name: "PostgreSQL", category: "DATABASE" as const },
    { name: "Prisma", category: "BACKEND" as const },
    { name: "Redis", category: "DATABASE" as const },
    { name: "Docker", category: "INFRASTRUCTURE" as const },
    { name: "Node.js", category: "BACKEND" as const },
    { name: "MinIO", category: "INFRASTRUCTURE" as const },
    { name: "Traefik", category: "INFRASTRUCTURE" as const },
    { name: "Python", category: "LANGUAGE" as const },
    { name: "PHP", category: "LANGUAGE" as const },
    { name: "Laravel", category: "BACKEND" as const },
  ];

  for (const tech of techs) {
    const slug = tech.name
      .toLowerCase()
      .replace(/\./g, "")
      .replace(/\s+/g, "-");
    await db.technology.upsert({
      where: { slug },
      update: {},
      create: { ...tech, slug },
    });
  }
  console.log(`✅ ${techs.length} Technologien erstellt`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
