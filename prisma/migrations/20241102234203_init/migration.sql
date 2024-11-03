-- CreateEnum
CREATE TYPE "LocationTypeEnum" AS ENUM ('channel', 'group');

-- CreateTable
CREATE TABLE "Giveaway" (
    "id" SERIAL NOT NULL,
    "locationId" INTEGER NOT NULL,

    CONSTRAINT "Giveaway_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiveawayLocation" (
    "id" SERIAL NOT NULL,
    "type" "LocationTypeEnum" NOT NULL,

    CONSTRAINT "GiveawayLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Giveaway_locationId_key" ON "Giveaway"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "Giveaway" ADD CONSTRAINT "Giveaway_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "GiveawayLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
