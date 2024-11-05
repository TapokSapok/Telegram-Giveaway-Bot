/*
  Warnings:

  - Made the column `isWinner` on table `UserParticipant` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "UserParticipant" ALTER COLUMN "isWinner" SET NOT NULL;
