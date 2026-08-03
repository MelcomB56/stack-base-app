-- AlterTable
ALTER TABLE "apps" ADD COLUMN     "last_deployment_success" BOOLEAN,
ADD COLUMN     "security_rating" INTEGER,
ADD COLUMN     "test_coverage_percent" INTEGER;

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "audience" VARCHAR(50) NOT NULL DEFAULT 'all',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);
