-- CreateEnum
CREATE TYPE "CertStatus" AS ENUM ('VALID', 'EXPIRING_SOON', 'EXPIRED', 'ERROR', 'UNKNOWN');

-- CreateTable
CREATE TABLE "cert_checks" (
    "id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "domain" VARCHAR(253) NOT NULL,
    "valid_from" TIMESTAMP(3),
    "valid_to" TIMESTAMP(3),
    "issuer" VARCHAR(255),
    "subject" VARCHAR(255),
    "days_left" INTEGER,
    "status" "CertStatus" NOT NULL DEFAULT 'UNKNOWN',
    "error_msg" VARCHAR(500),
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cert_checks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cert_checks_app_id_checked_at_idx" ON "cert_checks"("app_id", "checked_at");

-- AddForeignKey
ALTER TABLE "cert_checks" ADD CONSTRAINT "cert_checks_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
