-- CreateEnum
CREATE TYPE "Bonus" AS ENUM ('None', 'BreederDiscount', 'VendorDiscount', 'LastChance', 'SpeciesSpecialist', 'NatureExpert', 'ElementAttuned');

-- CreateEnum
CREATE TYPE "Element" AS ENUM ('None', 'Water', 'Fire', 'Air', 'Plant', 'Earth', 'Light', 'Dark', 'Mineral', 'Corrupt', 'Ether', 'Bug', 'Monster');

-- CreateEnum
CREATE TYPE "Chroma" AS ENUM ('None', 'Chroma', 'Super');

-- CreateEnum
CREATE TYPE "Rarity" AS ENUM ('Unknown', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Unique');

-- CreateEnum
CREATE TYPE "Species" AS ENUM ('Unknown', 'Nissel', 'Finantis', 'Karoite', 'Nuvea', 'Hodeon', 'Eulocelus', 'Arnoriel', 'Raptoriel', 'Carcoid', 'Adhamandra', 'Ainepolux', 'Kapryno', 'Kitsul', 'Kitsumbra', 'Rattuos', 'Beldar', 'Belpillar', 'Beldarion', 'Firemon', 'Obryos', 'Mosuo', 'Lumi', 'Glaumer', 'Zhilumian', 'Onydae', 'Skycyx', 'Cinyx', 'Droserace', 'Hydraserace', 'Kerval', 'Kervalio', 'Megakeras', 'Gwenbee', 'Shazark', 'Krokon', 'Kradarkus', 'Clocarstone', 'Qwarzil', 'Tokaleaf', 'Sunopendra', 'Pendraminax', 'Yotnar', 'Hikarul', 'Opal', 'Aubelyon', 'Flint', 'Kraker', 'Venuserpien', 'Drakava', 'Espyke', 'Mobyd', 'Orcabyd', 'Ghorgon', 'Mellio', 'Fugush', 'Morphee', 'Morphian', 'Morphoon', 'Lounn', 'Lumiann', 'Uzumebach', 'Zumestra', 'Gemarites', 'Methyst', 'Spectross', 'Tamandu', 'Kanitro', 'Tytan', 'Moffunap', 'Nymphel', 'Buzzel', 'Jarel', 'Lumel', 'Vultrel', 'Allacrow', 'Corvalloy', 'Jokull', 'Vulpyro', 'Vulcario', 'Vulkran', 'Fayde', 'Kasscade', 'Ruard', 'Caerthos', 'Ryomizu', 'Obsy', 'Ceflora', 'Carnivyan', 'Dhaek', 'Drapex', 'Metheo', 'Glazzyx', 'Nythe', 'Nyferr', 'Wargrim', 'Meissa', 'Fluozacil', 'Zacirel', 'Vramakan', 'Cyarabat', 'Darkali', 'Struthor', 'Istral', 'Magistral', 'Norax', 'Cyzorak', 'Rhinurak', 'Trizorak', 'Kaos', 'Bird01', 'Bird02', 'Fish1geo', 'Fish2geo', 'Cephlare', 'Cephalopot', 'Krakenoa', 'Athel', 'Athidel', 'Athalasia', 'Lamphal', 'Lamphanuar', 'Geckaiba', 'Draxill', 'Kyrun', 'Sauderon', 'Ayacinth', 'Zhytrous', 'CuerpoHeraldo', 'Pikrel', 'Puffel');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('Unknown', 'Male', 'Female');

-- CreateEnum
CREATE TYPE "Nature" AS ENUM ('Unknown', 'Dauntless', 'Executive', 'Restless', 'Nervous', 'Cunning', 'Energetic', 'Clever', 'Confident', 'Ignorant', 'Arrogant', 'Biting', 'Aggressive', 'Patient', 'Mature', 'Sensible', 'Calm', 'Rude', 'Cautious', 'Curious', 'Discrete', 'Loyal');

-- CreateEnum
CREATE TYPE "TrainerAccentColor" AS ENUM ('Unknown', 'Blue', 'Green', 'Pink', 'Red', 'Yellow');

-- CreateEnum
CREATE TYPE "TrainerSkinTone" AS ENUM ('Unknown', 'Chocolate', 'Coffee', 'Desert', 'Mediterranean', 'Pale', 'Pasty', 'SunBurnt');

-- CreateEnum
CREATE TYPE "TrainerHairStyle" AS ENUM ('Unknown', 'Emo', 'Ahoge', 'MediumPixiBangs', 'LongWithBangs');

-- CreateEnum
CREATE TYPE "TrainerTop" AS ENUM ('Unknown', 'ShirtWithTankTop', 'MaleTankTop', 'FemaleTankTop', 'SleevelessTurtleneck');

-- CreateEnum
CREATE TYPE "TrainerBottom" AS ENUM ('Unknown', 'CargoShorts', 'DressPants', 'SkirtWithStockings', 'RunningShorts');

-- CreateTable
CREATE TABLE "evos"
(
    "id"            SERIAL       NOT NULL,
    "tokenId"       BIGINT       NOT NULL,
    "gender"        "Gender"     NOT NULL DEFAULT 'Unknown',
    "generation"    INTEGER      NOT NULL,
    "nature"        "Nature"     NOT NULL DEFAULT 'Unknown',
    "rarity"        "Rarity"     NOT NULL DEFAULT 'Unknown',
    "chroma"        "Chroma"     NOT NULL DEFAULT 'None',
    "species"       "Species"    NOT NULL DEFAULT 'Unknown',
    "totalBreeds"   INTEGER      NOT NULL DEFAULT 0,
    "lastBreedTime" TIMESTAMP(3),
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,
    "attack"        INTEGER      NOT NULL DEFAULT 0,
    "special"       INTEGER      NOT NULL DEFAULT 0,
    "defense"       INTEGER      NOT NULL DEFAULT 0,
    "resistance"    INTEGER      NOT NULL DEFAULT 0,
    "speed"         INTEGER      NOT NULL DEFAULT 0,
    "size"          INTEGER      NOT NULL DEFAULT 0,
    "xp"            INTEGER      NOT NULL DEFAULT 0,

    CONSTRAINT "evos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eggs"
(
    "id"         SERIAL       NOT NULL,
    "tokenId"    BIGINT       NOT NULL,
    "species"    "Species"    NOT NULL DEFAULT 'Unknown',
    "generation" INTEGER      NOT NULL,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL,
    "hatchedAt"  TIMESTAMP(3),
    "parent1Id"  BIGINT,
    "parent2Id"  BIGINT,
    "treated"    BOOLEAN      NOT NULL DEFAULT false,

    CONSTRAINT "eggs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "species_types"
(
    "id"        SERIAL    NOT NULL,
    "species"   "Species" NOT NULL,
    "primary"   "Element" NOT NULL,
    "secondary" "Element" NOT NULL,

    CONSTRAINT "species_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collections"
(
    "id"            SERIAL       NOT NULL,
    "address"       CHAR(42)     NOT NULL,
    "name"          TEXT         NOT NULL,
    "description"   TEXT         NOT NULL,
    "image"         TEXT         NOT NULL DEFAULT '',
    "banner_image"  TEXT         NOT NULL DEFAULT '',
    "external_link" TEXT         NOT NULL DEFAULT '',
    "collaborators" TEXT[],
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainers"
(
    "id"           SERIAL               NOT NULL,
    "tokenId"      BIGINT               NOT NULL,
    "name"         TEXT                 NOT NULL,
    "gender"       "Gender"             NOT NULL DEFAULT 'Unknown',
    "rarity"       "Rarity"             NOT NULL DEFAULT 'Unknown',
    "attuned"      "Element"            NOT NULL DEFAULT 'None',
    "expert"       "Nature"             NOT NULL DEFAULT 'Unknown',
    "specialty"    "Species"            NOT NULL DEFAULT 'Unknown',
    "hair_style"   "TrainerHairStyle"   NOT NULL DEFAULT 'Unknown',
    "hair_color"   "TrainerAccentColor" NOT NULL DEFAULT 'Unknown',
    "eye_color"    "TrainerAccentColor" NOT NULL DEFAULT 'Unknown',
    "top"          "TrainerTop"         NOT NULL DEFAULT 'Unknown',
    "top_color"    "TrainerAccentColor" NOT NULL DEFAULT 'Unknown',
    "bottom"       "TrainerBottom"      NOT NULL DEFAULT 'Unknown',
    "bottom_color" "TrainerAccentColor" NOT NULL DEFAULT 'Unknown',

    CONSTRAINT "trainers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainer_bonuses"
(
    "id"       SERIAL           NOT NULL,
    "bonus"    "Bonus"          NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "species"  "Species"        NOT NULL DEFAULT 'Unknown',
    "nature"   "Nature"         NOT NULL DEFAULT 'Unknown',
    "element"  "Element"        NOT NULL DEFAULT 'None',

    CONSTRAINT "trainer_bonuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bonus_on_trainer"
(
    "bonus_id"   INTEGER NOT NULL,
    "trainer_id" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_EggToEvo"
(
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "evos_tokenId_key" ON "evos" ("tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "eggs_tokenId_key" ON "eggs" ("tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "species_types_species_key" ON "species_types" ("species");

-- CreateIndex
CREATE UNIQUE INDEX "collections_address_key" ON "collections" ("address");

-- CreateIndex
CREATE UNIQUE INDEX "trainers_tokenId_key" ON "trainers" ("tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "bonus_id_trainer_id_unique" ON "bonus_on_trainer" ("bonus_id", "trainer_id");

-- CreateIndex
CREATE UNIQUE INDEX "_EggToEvo_AB_unique" ON "_EggToEvo" ("A", "B");

-- CreateIndex
CREATE INDEX "_EggToEvo_B_index" ON "_EggToEvo" ("B");

-- AddForeignKey
ALTER TABLE "evos"
    ADD CONSTRAINT "evos_species_fkey" FOREIGN KEY ("species") REFERENCES "species_types" ("species") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eggs"
    ADD CONSTRAINT "eggs_species_fkey" FOREIGN KEY ("species") REFERENCES "species_types" ("species") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bonus_on_trainer"
    ADD CONSTRAINT "bonus_on_trainer_bonus_id_fkey" FOREIGN KEY ("bonus_id") REFERENCES "trainer_bonuses" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bonus_on_trainer"
    ADD CONSTRAINT "bonus_on_trainer_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "trainers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EggToEvo"
    ADD CONSTRAINT "_EggToEvo_A_fkey" FOREIGN KEY ("A") REFERENCES "eggs" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EggToEvo"
    ADD CONSTRAINT "_EggToEvo_B_fkey" FOREIGN KEY ("B") REFERENCES "evos" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
