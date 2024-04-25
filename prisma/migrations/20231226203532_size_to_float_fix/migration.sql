/*
  Warnings:

  - You are about to alter the column `xp` on the `evos` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "evos"
    ALTER COLUMN "size" SET DEFAULT 0,
ALTER
COLUMN "size" SET DATA TYPE DOUBLE PRECISION,
ALTER
COLUMN "xp" SET DEFAULT 0,
ALTER
COLUMN "xp" SET DATA TYPE INTEGER;
