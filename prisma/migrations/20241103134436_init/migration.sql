/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `GiveawayLocation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "GiveawayLocation" ADD COLUMN     "name" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "GiveawayLocation_name_key" ON "GiveawayLocation"("name");
