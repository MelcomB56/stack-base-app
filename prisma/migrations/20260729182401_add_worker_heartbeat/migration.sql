-- CreateTable
CREATE TABLE "worker_heartbeats" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "last_ping" TIMESTAMP(3) NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "checks_run" INTEGER NOT NULL DEFAULT 0,
    "pid" INTEGER,

    CONSTRAINT "worker_heartbeats_pkey" PRIMARY KEY ("id")
);
