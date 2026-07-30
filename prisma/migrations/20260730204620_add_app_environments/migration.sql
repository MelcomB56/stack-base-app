-- CreateEnum
CREATE TYPE "EnvironmentType" AS ENUM ('DEVELOPMENT', 'STAGING', 'PRODUCTION', 'CUSTOM');

-- CreateEnum
CREATE TYPE "EnvironmentStatus" AS ENUM ('ONLINE', 'OFFLINE', 'DEGRADED', 'UNKNOWN', 'MAINTENANCE');

-- CreateTable
CREATE TABLE "app_environments" (
    "id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" "EnvironmentType" NOT NULL DEFAULT 'CUSTOM',
    "url" VARCHAR(500),
    "status" "EnvironmentStatus" NOT NULL DEFAULT 'UNKNOWN',
    "status_note" VARCHAR(255),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_environments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "app_environments_app_id_idx" ON "app_environments"("app_id");

-- AddForeignKey
ALTER TABLE "app_environments" ADD CONSTRAINT "app_environments_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
