/*
  Warnings:

  - The primary key for the `GiveawayLocation` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Giveaway" DROP CONSTRAINT "Giveaway_locationId_fkey";

-- AlterTable
ALTER TABLE "Giveaway" ALTER COLUMN "locationId" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "GiveawayLocation" DROP CONSTRAINT "GiveawayLocation_pkey",
ALTER COLUMN "id" SET DATA TYPE BIGINT,
ADD CONSTRAINT "GiveawayLocation_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "Giveaway" ADD CONSTRAINT "Giveaway_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "GiveawayLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
