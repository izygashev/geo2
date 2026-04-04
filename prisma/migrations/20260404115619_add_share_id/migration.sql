/*
  Warnings:

  - A unique constraint covering the columns `[shareId]` on the table `Report` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "shareId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Report_shareId_key" ON "Report"("shareId");
