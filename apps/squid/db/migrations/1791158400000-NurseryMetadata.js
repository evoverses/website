const fs = require("node:fs");
const path = require("node:path");
module.exports = class NurseryMetadata1791158400000 {
  name = "NurseryMetadata1791158400000";
  async up(db) {
    await db.query(
      fs.readFileSync(
        path.join(__dirname, "nursery-1791158400000/up.sql"),
        "utf8",
      ),
    );
  }
  async down(db) {
    await db.query(
      fs.readFileSync(
        path.join(__dirname, "nursery-1791158400000/down.sql"),
        "utf8",
      ),
    );
  }
};
