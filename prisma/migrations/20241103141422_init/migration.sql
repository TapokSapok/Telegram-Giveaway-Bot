/*
  Warnings:

  - You are about to drop the `_GiveawayToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_GiveawayToUser" DROP CONSTRAINT "_GiveawayToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_GiveawayToUser" DROP CONSTRAINT "_GiveawayToUser_B_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "giveawayId" INTEGER;

-- DropTable
DROP TABLE "_GiveawayToUser";

-- CreateTable
CREATE TABLE "GiveawayPlay" (
    "id" SERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "giveawayId" INTEGER NOT NULL,

    CONSTRAINT "GiveawayPlay_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GiveawayPlay" ADD CONSTRAINT "GiveawayPlay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiveawayPlay" ADD CONSTRAINT "GiveawayPlay_giveawayId_fkey" FOREIGN KEY ("giveawayId") REFERENCES "Giveaway"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_giveawayId_fkey" FOREIGN KEY ("giveawayId") REFERENCES "Giveaway"("id") ON DELETE SET NULL ON UPDATE CASCADE;
