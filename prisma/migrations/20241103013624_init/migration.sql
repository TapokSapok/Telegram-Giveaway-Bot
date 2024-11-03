-- AlterTable
ALTER TABLE "Giveaway" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "messageId" BIGINT,
ADD COLUMN     "publicated" BOOLEAN NOT NULL DEFAULT false;
