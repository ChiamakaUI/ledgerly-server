import pg from "pg";
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = __dirname;

async function migrate() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Connected to database");

    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id          SERIAL PRIMARY KEY,
        name        TEXT NOT NULL UNIQUE,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    const { rows: executed } = await client.query(
      "SELECT name FROM _migrations ORDER BY id"
    );
    const executedNames = new Set(executed.map((r) => r.name));

    const files = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    if (files.length === 0) {
      console.log("No migration files found");
      return;
    }

    let applied = 0;

    for (const file of files) {
      if (executedNames.has(file)) {
        console.log(`  ✓ ${file} (already applied)`);
        continue;
      }

      const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf-8");

      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
        await client.query("COMMIT");
        console.log(`  ✅ ${file} (applied)`);
        applied++;
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`  ❌ ${file} (failed):`, err);
        throw err;
      }
    }

    if (applied === 0) {
      console.log("\nAll migrations are up to date");
    } else {
      console.log(`\nApplied ${applied} migration(s)`);
    }
  } finally {
    await client.end();
  }
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});