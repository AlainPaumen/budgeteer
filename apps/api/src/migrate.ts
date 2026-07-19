import { Database } from "bun:sqlite";
import { readdirSync, readFileSync } from "node:fs";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

const MAX_BACKUPS = 5;

function getGitHash(): string {
	try {
		const head = readFileSync(".git/HEAD", "utf-8").trim();
		if (head.startsWith("ref: ")) {
			const refPath = `.git/${head.slice(5)}`;
			return readFileSync(refPath, "utf-8").trim().slice(0, 7);
		}
		return head.slice(0, 7);
	} catch {
		return "unknown";
	}
}

function cleanupBackups(dbDir: string) {
	const files = readdirSync(dbDir)
		.filter((f) => f.startsWith("budgeteer.db.backup."))
		.sort()
		.reverse();

	for (const file of files.slice(MAX_BACKUPS)) {
		Bun.file(`${dbDir}/${file}`).delete();
		console.log(`Removed old backup: ${file}`);
	}
}

export function runMigrations(dbPath: string) {
	if (process.env.SKIP_MIGRATIONS === "true") {
		console.log("Skipping migrations (SKIP_MIGRATIONS=true)");
		return;
	}

	const dbDir = dbPath.substring(0, dbPath.lastIndexOf("/"));

	// 1. Backup
	const gitHash = getGitHash();
	const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
	const backupPath = `${dbPath}.backup.${gitHash}.${timestamp}`;

	const db = new Database(dbPath);
	db.exec(`VACUUM INTO '${backupPath}'`);
	console.log(`Backed up database to ${backupPath}`);
	db.close();

	// 2. Clean old backups
	cleanupBackups(dbDir);

	// 3. Run migrations
	const dbForMigrate = new Database(dbPath);
	const drizzleDb = drizzle(dbForMigrate);
	migrate(drizzleDb, { migrationsFolder: "./src/db/migrations" });
	console.log("Migrations applied successfully");
	dbForMigrate.close();
}
