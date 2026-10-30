import Database from "better-sqlite3";
import { readdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

// Creates a fresh test.db from the Prisma migrations before the test run.
export default function setup() {
	const dbFile = "test.db";
	rmSync(dbFile, { force: true });

	const db = new Database(dbFile);
	const migrationsDir = join("prisma", "migrations");
	const migrations = readdirSync(migrationsDir, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.sort();

	for (const name of migrations) {
		db.exec(readFileSync(join(migrationsDir, name, "migration.sql"), "utf8"));
	}
	db.close();

	return () => rmSync(dbFile, { force: true });
}
