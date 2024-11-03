/*
  Warnings:

  - You are about to drop the column `name` on the `GiveawayLocation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "GiveawayLocation" DROP COLUMN "name",
ADD COLUMN     "title" TEXT;
