-- AlterTable
ALTER TABLE "apps" ADD COLUMN     "github_synced_at" TIMESTAMP(3),
ADD COLUMN     "github_token" VARCHAR(255);
