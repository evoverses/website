/*
  Warnings:

  - A unique constraint covering the columns `[bonus,discount,species,nature,element]` on the table `trainer_bonuses` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Species" ADD VALUE 'Hidden1';
ALTER TYPE "Species" ADD VALUE 'Hidden2';
ALTER TYPE "Species" ADD VALUE 'Hidden3';
ALTER TYPE "Species" ADD VALUE 'Hidden4';
ALTER TYPE "Species" ADD VALUE 'Khadmon';

-- AlterTable
ALTER TABLE "species_types"
    ALTER COLUMN "secondary" DROP NOT NULL;

-- AlterTable
ALTER TABLE "trainer_bonuses"
    ALTER COLUMN "species" DROP NOT NULL,
ALTER
COLUMN "species" DROP
DEFAULT,
ALTER
COLUMN "nature" DROP
NOT NULL,
ALTER
COLUMN "nature" DROP
DEFAULT,
ALTER
COLUMN "element" DROP
NOT NULL,
ALTER
COLUMN "element" DROP
DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "trainer_bonus_unique" ON "trainer_bonuses" ("bonus", "discount", "species", "nature", "element");
