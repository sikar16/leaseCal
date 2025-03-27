/*
  Warnings:

  - A unique constraint covering the columns `[shareToken]` on the table `SharedLease` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `shareToken` to the `SharedLease` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SharedLease" ADD COLUMN     "shareToken" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "SharedLease_shareToken_key" ON "SharedLease"("shareToken");
