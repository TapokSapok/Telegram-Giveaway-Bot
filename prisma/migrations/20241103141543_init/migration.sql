/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `GiveawayPlay` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[giveawayId]` on the table `GiveawayPlay` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "GiveawayPlay_userId_key" ON "GiveawayPlay"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GiveawayPlay_giveawayId_key" ON "GiveawayPlay"("giveawayId");

-- CreateIndex
CREATE INDEX "GiveawayPlay_giveawayId_userId_idx" ON "GiveawayPlay"("giveawayId", "userId");
