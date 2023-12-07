-- CreateTable
CREATE TABLE "Evo"
(
    "id"            SERIAL       NOT NULL,
    "tokenId"       BIGINT       NOT NULL,
    "gender"        TEXT         NOT NULL,
    "generation"    INTEGER      NOT NULL,
    "nature"        TEXT         NOT NULL,
    "primaryType"   TEXT         NOT NULL,
    "secondaryType" TEXT,
    "rarity"        TEXT         NOT NULL,
    "species"       TEXT         NOT NULL,
    "totalBreeds"   INTEGER      NOT NULL,
    "lastBreedTime" TIMESTAMP(3),
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,
    "attack"        INTEGER      NOT NULL,
    "special"       INTEGER      NOT NULL,
    "defense"       INTEGER      NOT NULL,
    "resistance"    INTEGER      NOT NULL,
    "speed"         INTEGER      NOT NULL,
    "size"          INTEGER      NOT NULL,
    "xp"            INTEGER      NOT NULL DEFAULT 0,
    "egg"           BOOLEAN      NOT NULL,
    "parent1Id"     BIGINT,
    "parent2Id"     BIGINT,
    "treated"       BOOLEAN      NOT NULL DEFAULT false,

    CONSTRAINT "Evo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Evo_tokenId_key" ON "Evo" ("tokenId");
