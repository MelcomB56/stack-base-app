-- CreateEnum
CREATE TYPE "TargetType" AS ENUM ('SERVER', 'CLOUD', 'KUBERNETES', 'PAAS', 'OTHER');

-- CreateEnum
CREATE TYPE "RuntimeType" AS ENUM ('DOCKER', 'DOCKER_COMPOSE', 'KUBERNETES', 'SYSTEMD', 'PM2', 'BARE_PROCESS', 'STATIC', 'SERVERLESS', 'PAAS', 'IIS', 'OTHER');

-- AlterTable
ALTER TABLE "apps" ADD COLUMN     "container_port" INTEGER,
ADD COLUMN     "deployment_target_id" TEXT,
ADD COLUMN     "host_port" INTEGER,
ADD COLUMN     "runtime_type" "RuntimeType";

-- CreateTable
CREATE TABLE "deployment_targets" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" "TargetType" NOT NULL DEFAULT 'SERVER',
    "host" VARCHAR(255),
    "provider" VARCHAR(100),
    "region" VARCHAR(100),
    "notes" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deployment_targets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deployment_targets_name_key" ON "deployment_targets"("name");

-- AddForeignKey
ALTER TABLE "apps" ADD CONSTRAINT "apps_deployment_target_id_fkey" FOREIGN KEY ("deployment_target_id") REFERENCES "deployment_targets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
