import "dotenv/config";

type DBCredentials = {
  host: string,
  port: number,
  user: string,
  password: string,
  database: string
}

const c = {
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
} as DBCredentials;
for (const [ key, value ] of Object.entries(c)) {
  if (!value) {
    throw new Error(`DATABASE_${(
      key === "database"
        ? "name"
        : key
    ).toUpperCase()} environment variable not found. Please add it to your .env file.`);
  }
}

export const databaseUrl = `postgres://${c.user}:${c.password}@${c.host}:${c.port}/${c.database}?sslmode=no-verify`;

export const dbCredentials = { ...c, ssl: { rejectUnauthorized: false } };
