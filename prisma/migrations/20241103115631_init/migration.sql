/*
  Warnings:

  - You are about to drop the column `resultsDate` on the `Giveaway` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Giveaway" DROP COLUMN "resultsDate",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "resultsAt" TIMESTAMP(3);
