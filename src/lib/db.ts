import "server-only";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Bump whenever prisma generate runs (invalidates HMR-cached singleton)
const SCHEMA_VER = "7";

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaSchemaVer: string | undefined;
};

function getDb() {
  if (globalForPrisma.prisma && globalForPrisma.prismaSchemaVer === SCHEMA_VER) {
    return globalForPrisma.prisma;
  }
  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaSchemaVer = SCHEMA_VER;
  }
  return client;
}

export const db = getDb();
