-- AlterTable
ALTER TABLE "apps" ADD COLUMN     "docker_container" VARCHAR(100),
ADD COLUMN     "docker_host" VARCHAR(255);

-- CreateTable
CREATE TABLE "resource_readings" (
    "id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "cpu_percent" DOUBLE PRECISION,
    "mem_used" BIGINT,
    "mem_limit" BIGINT,
    "mem_percent" DOUBLE PRECISION,
    "net_in" BIGINT,
    "net_out" BIGINT,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resource_readings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resource_readings_app_id_read_at_idx" ON "resource_readings"("app_id", "read_at");

-- AddForeignKey
ALTER TABLE "resource_readings" ADD CONSTRAINT "resource_readings_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
