import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const { Client } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const envPath = path.join(rootDir, ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#")) {
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex > 0) {
      env[trimmed.substring(0, eqIndex)] = trimmed.substring(eqIndex + 1);
    }
  }
});

let DATABASE_URL = env.NEXT_PUBLIC_DATABASE_URL;
// Remove channel_binding if present
DATABASE_URL = DATABASE_URL.replace("&channel_binding=require", "");

async function checkNeon() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log("Connected to Neon DB.");

  const { rows: tables } = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  `);

  console.log("\n--- Tables in Neon ---");
  tables.forEach(t => console.log(t.table_name));

  for (const t of tables) {
    const { rows: cols } = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1;
    `, [t.table_name]);
    console.log(`\nTable: ${t.table_name}`);
    cols.forEach(c => console.log(`  - ${c.column_name} (${c.data_type}) NULL: ${c.is_nullable}`));
  }

  await client.end();
}

checkNeon().catch(console.error);
