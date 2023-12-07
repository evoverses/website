/*
  Warnings:

  - You are about to drop the column `primaryType` on the `SpeciesTypes` table. All the data in the column will be lost.
  - You are about to drop the column `secondaryType` on the `SpeciesTypes` table. All the data in the column will be lost.
  - Added the required column `primary` to the `SpeciesTypes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `secondary` to the `SpeciesTypes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SpeciesTypes" DROP COLUMN "primaryType",
DROP
COLUMN "secondaryType",
ADD COLUMN     "primary" "Type" NOT NULL,
ADD COLUMN     "secondary" "Type" NOT NULL;
