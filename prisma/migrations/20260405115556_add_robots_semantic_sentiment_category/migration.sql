-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "categorySearched" TEXT,
ADD COLUMN     "robotsTxtAiFriendly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "semanticHtmlValid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sentiment" TEXT;

-- AlterTable
ALTER TABLE "ShareOfVoice" ADD COLUMN     "categorySearched" TEXT,
ADD COLUMN     "sentiment" TEXT;
