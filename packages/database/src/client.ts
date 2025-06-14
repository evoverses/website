import { databaseUrl } from "@workspace/database/config";
import { drizzle } from "drizzle-orm/node-postgres";

export const db = drizzle(databaseUrl);
