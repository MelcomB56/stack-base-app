-- CreateEnum
CREATE TYPE "Criticality" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "HealthStatus" AS ENUM ('UP', 'DEGRADED', 'DOWN', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED');

-- AlterTable
ALTER TABLE "apps" ADD COLUMN     "criticality" "Criticality" DEFAULT 'MEDIUM',
ADD COLUMN     "vendor" VARCHAR(100);

-- CreateTable
CREATE TABLE "app_dependencies" (
    "id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "depends_on_app_id" TEXT,
    "depends_on_name" VARCHAR(100),
    "relationship_type" "RelationshipType" NOT NULL DEFAULT 'REQUIRES',
    "description" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitor_configs" (
    "id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "interval_min" INTEGER NOT NULL DEFAULT 5,
    "timeout_sec" INTEGER NOT NULL DEFAULT 10,
    "check_url" VARCHAR(500),
    "expected_status" INTEGER NOT NULL DEFAULT 200,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monitor_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_checks" (
    "id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "status" "HealthStatus" NOT NULL,
    "response_time" INTEGER,
    "status_code" INTEGER,
    "error_msg" VARCHAR(500),
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "severity" "IncidentSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "auto_created" BOOLEAN NOT NULL DEFAULT false,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "app_dependencies_app_id_idx" ON "app_dependencies"("app_id");

-- CreateIndex
CREATE UNIQUE INDEX "monitor_configs_app_id_key" ON "monitor_configs"("app_id");

-- CreateIndex
CREATE INDEX "health_checks_app_id_checked_at_idx" ON "health_checks"("app_id", "checked_at");

-- CreateIndex
CREATE INDEX "incidents_app_id_idx" ON "incidents"("app_id");

-- CreateIndex
CREATE INDEX "incidents_status_idx" ON "incidents"("status");

-- AddForeignKey
ALTER TABLE "app_dependencies" ADD CONSTRAINT "app_dependencies_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_dependencies" ADD CONSTRAINT "app_dependencies_depends_on_app_id_fkey" FOREIGN KEY ("depends_on_app_id") REFERENCES "apps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitor_configs" ADD CONSTRAINT "monitor_configs_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_checks" ADD CONSTRAINT "health_checks_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
