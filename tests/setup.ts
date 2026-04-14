import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "@/server/db/schema";
import path from "path";

// Create an in-memory SQLite database for tests
export function createTestDb() {
  const sqlite = new Database(":memory:");
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });

  // Apply migrations
  migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle/migrations") });

  return { db, sqlite };
}
