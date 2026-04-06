-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "fingerprintId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "authProvider" TEXT NOT NULL DEFAULT 'credentials';

-- CreateIndex
CREATE INDEX "Report_fingerprintId_idx" ON "Report"("fingerprintId");
