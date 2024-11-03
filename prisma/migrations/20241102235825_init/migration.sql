/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `Giveaway` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `GiveawayLocation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Giveaway` table without a default value. This is not possible if the table is not empty.
  - Added the required column `winnerCount` to the `Giveaway` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `GiveawayLocation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Giveaway" ADD COLUMN     "botsProtection" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "buttonText" TEXT NOT NULL DEFAULT 'Участвовать',
ADD COLUMN     "messageText" TEXT,
ADD COLUMN     "resultsDate" TIMESTAMP(3),
ADD COLUMN     "userId" INTEGER NOT NULL,
ADD COLUMN     "winnerCount" INTEGER NOT NULL,
ADD COLUMN     "winners" TEXT;

-- AlterTable
ALTER TABLE "GiveawayLocation" ADD COLUMN     "userId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Giveaway_userId_key" ON "Giveaway"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GiveawayLocation_userId_key" ON "GiveawayLocation"("userId");

-- AddForeignKey
ALTER TABLE "Giveaway" ADD CONSTRAINT "Giveaway_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiveawayLocation" ADD CONSTRAINT "GiveawayLocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
