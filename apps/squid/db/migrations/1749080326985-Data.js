module.exports = class Data1749080326985 {
  name = "Data1749080326985";

  async up(db) {
    await db.query(`ALTER TABLE "chain" ALTER COLUMN "name" DROP NOT NULL`);
    await db.query(`ALTER TABLE "chain" ALTER COLUMN "symbol" DROP NOT NULL`);
  }

  async down(db) {
    await db.query(`ALTER TABLE "chain" ALTER COLUMN "name" SET NOT NULL`);
    await db.query(`ALTER TABLE "chain" ALTER COLUMN "symbol" SET NOT NULL`);
  }
};
