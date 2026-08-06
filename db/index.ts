import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

let database: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (database) return database;

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is missing. Add it to the deployment environment.");
  }

  const client = postgres(connectionString, {
    prepare: false,
    max: 1,
  });

  database = drizzle(client, { schema });
  return database;
}
