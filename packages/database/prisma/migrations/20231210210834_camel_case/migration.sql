/*
  Warnings:

  - You are about to drop the column `bonus_id` on the `bonus_on_trainer` table. All the data in the column will be lost.
  - You are about to drop the column `trainer_id` on the `bonus_on_trainer` table. All the data in the column will be lost.
  - You are about to drop the column `banner_image` on the `collections` table. All the data in the column will be lost.
  - You are about to drop the column `external_link` on the `collections` table. All the data in the column will be lost.
  - You are about to drop the column `bottom_color` on the `trainers` table. All the data in the column will be lost.
  - You are about to drop the column `eye_color` on the `trainers` table. All the data in the column will be lost.
  - You are about to drop the column `hair_color` on the `trainers` table. All the data in the column will be lost.
  - You are about to drop the column `hair_style` on the `trainers` table. All the data in the column will be lost.
  - You are about to drop the column `top_color` on the `trainers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[bonusId,trainerId]` on the table `bonus_on_trainer` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `bonusId` to the `bonus_on_trainer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trainerId` to the `bonus_on_trainer` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "bonus_on_trainer" DROP CONSTRAINT "bonus_on_trainer_bonus_id_fkey";

-- DropForeignKey
ALTER TABLE "bonus_on_trainer" DROP CONSTRAINT "bonus_on_trainer_trainer_id_fkey";

-- DropIndex
DROP INDEX "bonus_id_trainer_id_unique";

-- AlterTable
ALTER TABLE "bonus_on_trainer" DROP COLUMN "bonus_id",
DROP
COLUMN "trainer_id",
ADD COLUMN     "bonusId" INTEGER NOT NULL,
ADD COLUMN     "trainerId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "collections" DROP COLUMN "banner_image",
DROP
COLUMN "external_link",
ADD COLUMN     "bannerImage" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "externalLink" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "trainers" DROP COLUMN "bottom_color",
DROP
COLUMN "eye_color",
DROP
COLUMN "hair_color",
DROP
COLUMN "hair_style",
DROP
COLUMN "top_color",
ADD COLUMN     "bottomColor" "TrainerAccentColor" NOT NULL DEFAULT 'Unknown',
ADD COLUMN     "eyeColor" "TrainerAccentColor" NOT NULL DEFAULT 'Unknown',
ADD COLUMN     "hairColor" "TrainerAccentColor" NOT NULL DEFAULT 'Unknown',
ADD COLUMN     "hairStyle" "TrainerHairStyle" NOT NULL DEFAULT 'Unknown',
ADD COLUMN     "topColor" "TrainerAccentColor" NOT NULL DEFAULT 'Unknown';

-- CreateIndex
CREATE UNIQUE INDEX "bonus_id_trainer_id_unique" ON "bonus_on_trainer" ("bonusId", "trainerId");

-- AddForeignKey
ALTER TABLE "bonus_on_trainer"
    ADD CONSTRAINT "bonus_on_trainer_bonusId_fkey" FOREIGN KEY ("bonusId") REFERENCES "trainer_bonuses" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bonus_on_trainer"
    ADD CONSTRAINT "bonus_on_trainer_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "trainers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
