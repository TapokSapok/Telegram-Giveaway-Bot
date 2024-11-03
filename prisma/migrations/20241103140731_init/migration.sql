/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Giveaway" DROP CONSTRAINT "Giveaway_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "GiveawayLocation" DROP CONSTRAINT "GiveawayLocation_userId_fkey";

-- DropForeignKey
ALTER TABLE "_GiveawayToUser" DROP CONSTRAINT "_GiveawayToUser_B_fkey";

-- AlterTable
ALTER TABLE "Giveaway" ALTER COLUMN "creatorId" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "GiveawayLocation" ALTER COLUMN "userId" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ALTER COLUMN "id" SET DATA TYPE BIGINT,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "_GiveawayToUser" ALTER COLUMN "B" SET DATA TYPE BIGINT;

-- AddForeignKey
ALTER TABLE "Giveaway" ADD CONSTRAINT "Giveaway_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiveawayLocation" ADD CONSTRAINT "GiveawayLocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GiveawayToUser" ADD CONSTRAINT "_GiveawayToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
