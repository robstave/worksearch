-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "hot" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hotDate" TIMESTAMP(3);
