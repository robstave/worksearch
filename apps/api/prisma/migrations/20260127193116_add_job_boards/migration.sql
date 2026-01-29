-- CreateTable
CREATE TABLE "JobBoard" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "link" TEXT,
    "notesMd" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobBoard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobBoard_ownerId_idx" ON "JobBoard"("ownerId");

-- AddForeignKey
ALTER TABLE "JobBoard" ADD CONSTRAINT "JobBoard_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
