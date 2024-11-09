/*
  Warnings:

  - You are about to drop the column `winnersIndex` on the `Giveaway` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Giveaway" DROP COLUMN "winnersIndex";

-- AlterTable
ALTER TABLE "UserParticipant" ADD COLUMN     "winnerIndex" INTEGER;
