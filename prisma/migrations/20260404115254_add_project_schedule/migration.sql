-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "scheduleFrequency" TEXT,
ADD COLUMN     "scheduleNextRun" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Project_scheduleNextRun_idx" ON "Project"("scheduleNextRun");
