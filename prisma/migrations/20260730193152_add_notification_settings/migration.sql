-- CreateTable
CREATE TABLE "notification_settings" (
    "id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "on_status_change" BOOLEAN NOT NULL DEFAULT true,
    "on_incident" BOOLEAN NOT NULL DEFAULT true,
    "on_release" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_settings_app_id_email_key" ON "notification_settings"("app_id", "email");

-- AddForeignKey
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
