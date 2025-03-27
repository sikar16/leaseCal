/*
  Warnings:

  - A unique constraint covering the columns `[shareToken]` on the table `Lease` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Lease" ADD COLUMN     "shareToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Lease_shareToken_key" ON "Lease"("shareToken");
