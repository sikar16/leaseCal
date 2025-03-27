/*
  Warnings:

  - A unique constraint covering the columns `[shareToken]` on the table `SharedLease` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[leaseId,userId]` on the table `SharedLease` will be added. If there are existing duplicate values, this will fail.
  - Made the column `shareToken` on table `SharedLease` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "SharedLease" ALTER COLUMN "shareToken" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "SharedLease_shareToken_key" ON "SharedLease"("shareToken");

-- CreateIndex
CREATE UNIQUE INDEX "SharedLease_leaseId_userId_key" ON "SharedLease"("leaseId", "userId");
