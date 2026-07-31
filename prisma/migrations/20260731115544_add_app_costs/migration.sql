-- CreateEnum
CREATE TYPE "CostCategory" AS ENUM ('SERVER', 'DOMAIN', 'CDN', 'STORAGE', 'LICENSE', 'OTHER');

-- CreateTable
CREATE TABLE "app_costs" (
    "id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "month" VARCHAR(7) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "category" "CostCategory" NOT NULL DEFAULT 'SERVER',
    "note" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_costs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "app_costs_app_id_idx" ON "app_costs"("app_id");

-- CreateIndex
CREATE INDEX "app_costs_month_idx" ON "app_costs"("month");

-- AddForeignKey
ALTER TABLE "app_costs" ADD CONSTRAINT "app_costs_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
