/*
  Warnings:

  - You are about to drop the column `winners` on the `Giveaway` table. All the data in the column will be lost.
  - You are about to drop the column `giveawayId` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_giveawayId_fkey";

-- AlterTable
ALTER TABLE "Giveaway" DROP COLUMN "winners";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "giveawayId";

-- AlterTable
ALTER TABLE "UserParticipant" ADD COLUMN     "isWinner" BOOLEAN NOT NULL DEFAULT false;
