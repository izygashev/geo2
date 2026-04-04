-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "contentLength" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "hasLlmsTxt" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "schemaOrgTypes" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "scoreAuthority" DOUBLE PRECISION,
ADD COLUMN     "scoreContent" DOUBLE PRECISION,
ADD COLUMN     "scoreLlmsTxt" DOUBLE PRECISION,
ADD COLUMN     "scoreSchema" DOUBLE PRECISION,
ADD COLUMN     "scoreSov" DOUBLE PRECISION,
ADD COLUMN     "siteDescription" TEXT,
ADD COLUMN     "siteH1" TEXT,
ADD COLUMN     "siteTitle" TEXT;

-- AlterTable
ALTER TABLE "ShareOfVoice" ADD COLUMN     "mentionContext" TEXT NOT NULL DEFAULT '';
