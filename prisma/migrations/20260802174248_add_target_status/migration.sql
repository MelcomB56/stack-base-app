-- CreateEnum
CREATE TYPE "TargetStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'OFFLINE');

-- AlterTable
ALTER TABLE "deployment_targets" ADD COLUMN     "status" "TargetStatus" NOT NULL DEFAULT 'ACTIVE';
