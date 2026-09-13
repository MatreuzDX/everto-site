/**
 * Postgres local para desenvolvimento, sem Docker nem direitos de administrador
 * (mesmo método do ayaha-crm). Em produção usa-se o Neon da Vercel.
 *
 *   npm run db:start   → arranca e fica a correr (porta 5434)
 *   npm run db:stop    → pára
 */

import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import EmbeddedPostgres from "embedded-postgres";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = path.join(ROOT, ".pgdata");

// 5434 para não colidir com o banco local do ayaha-crm (5433).
const DB = { user: "postgres", password: "postgres", port: 5434, database: "caetano" };

function instance() {
  return new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: DB.user,
    password: DB.password,
    port: DB.port,
    persistent: true,
  });
}

async function start() {
  const pg = instance();
  if (!existsSync(DATA_DIR)) {
    console.log("A inicializar o cluster em .pgdata …");
    await pg.initialise();
  }
  await pg.start();

  // Em Windows o initdb herda WIN1252; a base tem de ser UTF8.
  const { Client } = await import("pg");
  const admin = new Client({ ...DB, host: "localhost", database: "postgres" });
  await admin.connect();
  const { rowCount } = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [DB.database]);
  if (rowCount === 0) {
    await admin.query(
      `CREATE DATABASE "${DB.database}" ENCODING 'UTF8' TEMPLATE template0 LC_COLLATE 'C' LC_CTYPE 'C'`,
    );
    console.log(`Base "${DB.database}" criada.`);
  }
  await admin.end();

  console.log(`\nPostgres a correr: postgresql://${DB.user}:${DB.password}@localhost:${DB.port}/${DB.database}\n`);

  const shutdown = async () => {
    await pg.stop().catch(() => {});
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  setInterval(() => {}, 1 << 30);
}

async function stop() {
  await instance().stop().catch(() => {});
  console.log("Postgres parado.");
}

const cmd = process.argv[2] ?? "start";
if (cmd === "start") await start();
else if (cmd === "stop") await stop();
else if (cmd === "reset") {
  await stop();
  if (existsSync(DATA_DIR)) rmSync(DATA_DIR, { recursive: true, force: true });
} else {
  console.error("Use start | stop | reset");
  process.exit(1);
}
