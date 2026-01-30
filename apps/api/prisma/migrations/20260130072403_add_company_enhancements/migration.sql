-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "notesMd" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "revisit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "star" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "CompanyVisit" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "status" TEXT,

    CONSTRAINT "CompanyVisit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanyVisit_companyId_visitedAt_idx" ON "CompanyVisit"("companyId", "visitedAt");

-- CreateIndex
CREATE INDEX "Company_ownerId_star_idx" ON "Company"("ownerId", "star");

-- CreateIndex
CREATE INDEX "Company_ownerId_revisit_idx" ON "Company"("ownerId", "revisit");

-- AddForeignKey
ALTER TABLE "CompanyVisit" ADD CONSTRAINT "CompanyVisit_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
