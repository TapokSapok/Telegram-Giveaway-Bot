/*
  Warnings:

  - You are about to drop the `GiveawayPlay` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "GiveawayPlay" DROP CONSTRAINT "GiveawayPlay_giveawayId_fkey";

-- DropForeignKey
ALTER TABLE "GiveawayPlay" DROP CONSTRAINT "GiveawayPlay_userId_fkey";

-- DropTable
DROP TABLE "GiveawayPlay";

-- CreateTable
CREATE TABLE "UserParticipant" (
    "id" SERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "giveawayId" INTEGER NOT NULL,

    CONSTRAINT "UserParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserParticipant_userId_key" ON "UserParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserParticipant_giveawayId_key" ON "UserParticipant"("giveawayId");

-- CreateIndex
CREATE INDEX "UserParticipant_giveawayId_userId_idx" ON "UserParticipant"("giveawayId", "userId");

-- AddForeignKey
ALTER TABLE "UserParticipant" ADD CONSTRAINT "UserParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserParticipant" ADD CONSTRAINT "UserParticipant_giveawayId_fkey" FOREIGN KEY ("giveawayId") REFERENCES "Giveaway"("id") ON DELETE CASCADE ON UPDATE CASCADE;
