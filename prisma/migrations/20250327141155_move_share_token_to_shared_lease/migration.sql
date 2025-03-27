-- DropIndex
DROP INDEX "SharedLease_leaseId_userId_key";

-- DropIndex
DROP INDEX "SharedLease_shareToken_key";

-- DropIndex
DROP INDEX "SharedLease_userId_idx";

-- AlterTable
ALTER TABLE "SharedLease" ALTER COLUMN "shareToken" DROP NOT NULL;
