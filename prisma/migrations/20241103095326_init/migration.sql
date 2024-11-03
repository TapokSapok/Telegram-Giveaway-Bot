/*
  Warnings:

  - You are about to drop the column `userId` on the `Giveaway` table. All the data in the column will be lost.
  - Added the required column `creatorId` to the `Giveaway` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Giveaway" DROP CONSTRAINT "Giveaway_userId_fkey";

-- AlterTable
ALTER TABLE "Giveaway" DROP COLUMN "userId",
ADD COLUMN     "creatorId" INTEGER NOT NULL,
ADD COLUMN     "participantCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "_GiveawayToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_GiveawayToUser_AB_unique" ON "_GiveawayToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_GiveawayToUser_B_index" ON "_GiveawayToUser"("B");

-- AddForeignKey
ALTER TABLE "Giveaway" ADD CONSTRAINT "Giveaway_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GiveawayToUser" ADD CONSTRAINT "_GiveawayToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Giveaway"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GiveawayToUser" ADD CONSTRAINT "_GiveawayToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
