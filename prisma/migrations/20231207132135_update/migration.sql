/*
  Warnings:

  - You are about to drop the column `egg` on the `Evo` table. All the data in the column will be lost.
  - You are about to drop the column `parent1Id` on the `Evo` table. All the data in the column will be lost.
  - You are about to drop the column `parent2Id` on the `Evo` table. All the data in the column will be lost.
  - You are about to drop the column `primaryType` on the `Evo` table. All the data in the column will be lost.
  - You are about to drop the column `secondaryType` on the `Evo` table. All the data in the column will be lost.
  - You are about to drop the column `treated` on the `Evo` table. All the data in the column will be lost.
  - Changed the type of `gender` on the `Evo` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `nature` on the `Evo` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `rarity` on the `Evo` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `species` on the `Evo` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Type" AS ENUM ('None', 'Water', 'Fire', 'Air', 'Plant', 'Earth', 'Light', 'Dark', 'Mineral', 'Corrupt', 'Ether', 'Bug', 'Monster');

-- CreateEnum
CREATE TYPE "Rarity" AS ENUM ('Normal', 'Chroma', 'Epic');

-- CreateEnum
CREATE TYPE "Species" AS ENUM ('Unknown', 'Nissel', 'Finantis', 'Karoite', 'Nuvea', 'Hodeon', 'Eulocelus', 'Arnoriel', 'Raptoriel', 'Carcoid', 'Adhamandra', 'Ainepolux', 'Kapryno', 'Kitsul', 'Kitsumbra', 'Rattuos', 'Beldar', 'Belpillar', 'Beldarion', 'Firemon', 'Obryos', 'Mosuo', 'Lumi', 'Glaumer', 'Zhilumian', 'Onydae', 'Skycyx', 'Cinyx', 'Droserace', 'Hydraserace', 'Kerval', 'Kervalio', 'Megakeras', 'Gwenbee', 'Shazark', 'Krokon', 'Kradarkus', 'Clocarstone', 'Qwarzil', 'Tokaleaf', 'Sunopendra', 'Pendraminax', 'Yotnar', 'Hikarul', 'Opal', 'Aubelyon', 'Flint', 'Kraker', 'Venuserpien', 'Drakava', 'Espyke', 'Mobyd', 'Orcabyd', 'Ghorgon', 'Mellio', 'Fugush', 'Morphee', 'Morphian', 'Morphoon', 'Lounn', 'Lumiann', 'Uzumebach', 'Zumestra', 'Gemarites', 'Methyst', 'Spectross', 'Tamandu', 'Kanitro', 'Tytan', 'Moffunap', 'Nymphel', 'Buzzel', 'Jarel', 'Lumel', 'Vultrel', 'Allacrow', 'Corvalloy', 'Jokull', 'Vulpyro', 'Vulcario', 'Vulkran', 'Fayde', 'Kasscade', 'Ruard', 'Caerthos', 'Ryomizu', 'Obsy', 'Ceflora', 'Carnivyan', 'Dhaek', 'Drapex', 'Metheo', 'Glazzyx', 'Nythe', 'Nyferr', 'Wargrim', 'Meissa', 'Fluozacil', 'Zacirel', 'Vramakan', 'Cyarabat', 'Darkali', 'Struthor', 'Istral', 'Magistral', 'Norax', 'Cyzorak', 'Rhinurak', 'Trizorak', 'Kaos', 'Bird01', 'Bird02', 'Fish1geo', 'Fish2geo', 'Cephlare', 'Cephalopot', 'Krakenoa', 'Athel', 'Athidel', 'Athalasia', 'Lamphal', 'Lamphanuar', 'Geckaiba', 'Draxill', 'Kyrun', 'Sauderon', 'Ayacinth', 'Zhytrous', 'CuerpoHeraldo', 'Pikrel', 'Puffel');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('Male', 'Female');

-- CreateEnum
CREATE TYPE "Nature" AS ENUM ('Dauntless', 'Executive', 'Restless', 'Nervous', 'Cunning', 'Energetic', 'Clever', 'Confident', 'Ignorant', 'Arrogant', 'Biting', 'Aggressive', 'Patient', 'Mature', 'Sensible', 'Calm', 'Rude', 'Cautious', 'Curious', 'Discrete', 'Loyal');

-- AlterTable
ALTER TABLE "Evo" DROP COLUMN "egg",
DROP
COLUMN "parent1Id",
DROP
COLUMN "parent2Id",
DROP
COLUMN "primaryType",
DROP
COLUMN "secondaryType",
DROP
COLUMN "treated",
DROP
COLUMN "gender",
ADD COLUMN     "gender" "Gender" NOT NULL,
DROP
COLUMN "nature",
ADD COLUMN     "nature" "Nature" NOT NULL,
DROP
COLUMN "rarity",
ADD COLUMN     "rarity" "Rarity" NOT NULL,
DROP
COLUMN "species",
ADD COLUMN     "species" "Species" NOT NULL;

-- CreateTable
CREATE TABLE "Egg"
(
    "id"         SERIAL       NOT NULL,
    "tokenId"    BIGINT       NOT NULL,
    "species"    "Species"    NOT NULL,
    "generation" INTEGER      NOT NULL,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL,
    "parent1Id"  BIGINT,
    "parent2Id"  BIGINT,
    "treated"    BOOLEAN      NOT NULL DEFAULT false,

    CONSTRAINT "Egg_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpeciesTypes"
(
    "id"            SERIAL    NOT NULL,
    "species"       "Species" NOT NULL,
    "primaryType"   "Type"    NOT NULL,
    "secondaryType" "Type"    NOT NULL,

    CONSTRAINT "SpeciesTypes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Egg_tokenId_key" ON "Egg" ("tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "SpeciesTypes_species_key" ON "SpeciesTypes" ("species");

-- AddForeignKey
ALTER TABLE "Evo"
    ADD CONSTRAINT "Evo_species_fkey" FOREIGN KEY ("species") REFERENCES "SpeciesTypes" ("species") ON DELETE RESTRICT ON UPDATE CASCADE;
