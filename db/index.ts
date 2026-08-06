import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing. Add the PostgreSQL connection string to .env.local.");
}

const client = postgres(connectionString, {
  prepare: false,
  max: 1,
});

export const db = drizzle(client, { schema });
