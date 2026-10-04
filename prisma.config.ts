// Prisma ORM 7 CLI config.
// - DIRECT_DATABASE_URL (preferred) for CLI operations (migrate, db seed, db execute).
//   For Neon this MUST be the direct (non-pooler) URL. Falls back to DATABASE_URL.
// - Never fall back to empty string. If neither is set, the Prisma CLI fails with
//   a clear error message.
import "dotenv/config";
import { defineConfig } from "prisma/config";

function resolveDatasourceUrl(): string {
  const direct = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!direct) {
    throw new Error(
      "No database URL set for Prisma CLI. Set DIRECT_DATABASE_URL " +
        "(direct/non-pooler URL for Neon) or DATABASE_URL in your .env file.",
    );
  }
  return direct;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: resolveDatasourceUrl(),
  },
});
