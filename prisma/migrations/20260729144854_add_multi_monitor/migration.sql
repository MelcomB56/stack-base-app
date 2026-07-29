-- DropIndex
DROP INDEX "monitor_configs_app_id_key";

-- AlterTable
ALTER TABLE "health_checks" ADD COLUMN     "check_url" VARCHAR(500),
ADD COLUMN     "config_id" TEXT;

-- AlterTable
ALTER TABLE "monitor_configs" ADD COLUMN     "label" VARCHAR(100) NOT NULL DEFAULT 'Production';

-- CreateIndex
CREATE INDEX "health_checks_config_id_checked_at_idx" ON "health_checks"("config_id", "checked_at");

-- CreateIndex
CREATE INDEX "monitor_configs_app_id_idx" ON "monitor_configs"("app_id");

-- AddForeignKey
ALTER TABLE "health_checks" ADD CONSTRAINT "health_checks_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "monitor_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
