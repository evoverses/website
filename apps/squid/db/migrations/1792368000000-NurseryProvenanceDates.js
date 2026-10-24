const fs = require("node:fs");
const path = require("node:path");
module.exports = class NurseryProvenanceDates1792368000000 {
  name = "NurseryProvenanceDates1792368000000";
  async up(db) { await db.query(fs.readFileSync(path.join(__dirname, "nursery-1792368000000/up.sql"), "utf8")); }
  async down(db) { await db.query(fs.readFileSync(path.join(__dirname, "nursery-1792368000000/down.sql"), "utf8")); }
};
