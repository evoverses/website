/*
  Warnings:

  - You are about to drop the column `parent1Id` on the `eggs` table. All the data in the column will be lost.
  - You are about to drop the column `parent2Id` on the `eggs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "eggs" DROP COLUMN "parent1Id",
DROP
COLUMN "parent2Id";
