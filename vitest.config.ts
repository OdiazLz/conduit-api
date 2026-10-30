import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["tests/**/*.test.ts"],
		// A separate SQLite file so tests never touch dev.db.
		env: {
			DATABASE_URL: "file:./test.db",
			JWT_SECRET: "test-secret",
		},
		globalSetup: ["tests/global-setup.ts"],
		// All files share one SQLite database, run them one at a time.
		fileParallelism: false,
	},
});
