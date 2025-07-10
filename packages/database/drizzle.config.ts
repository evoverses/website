import "dotenv/config";
import { dbCredentials } from "@workspace/database/config";

import { defineConfig } from "drizzle-kit";

// noinspection JSUnusedGlobalSymbols
export default defineConfig({
  out: "./drizzle",
  schema: "./src/schema/*",
  dialect: "postgresql",
  dbCredentials,
  schemaFilter: [ "metadata" ],
  tablesFilter: [ "*" ],
  extensionsFilters: [],
});
