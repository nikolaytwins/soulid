import EmbeddedPostgres from "embedded-postgres";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PGPORT || 5432);
const databaseDir = path.join(root, "..", "data", "pg");

const pg = new EmbeddedPostgres({
  databaseDir,
  user: "soul",
  password: "soul",
  port,
  persistent: true
});

const already = await fs
  .access(path.join(databaseDir, "PG_VERSION"))
  .then(() => true)
  .catch(() => false);

if (!already) {
  await pg.initialise();
}
await pg.start();
try {
  await pg.createDatabase("soulstar");
} catch {
  // already exists on a later boot
}

console.log(`READY postgresql://soul:soul@localhost:${port}/soulstar?schema=public`);

const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

await new Promise(() => undefined);
