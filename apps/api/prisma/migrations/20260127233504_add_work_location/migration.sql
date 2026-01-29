-- CreateEnum
CREATE TYPE "WorkLocationType" AS ENUM ('REMOTE', 'ONSITE', 'HYBRID', 'CONTRACT');

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "workLocation" "WorkLocationType" DEFAULT 'HYBRID';
