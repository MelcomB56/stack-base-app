-- CreateTable
CREATE TABLE "worker_jobs" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "finished_at" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL DEFAULT 'running',
    "item_count" INTEGER,
    "error" VARCHAR(500),

    CONSTRAINT "worker_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "worker_jobs_name_started_at_idx" ON "worker_jobs"("name", "started_at");
