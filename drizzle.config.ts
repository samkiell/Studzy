import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const dbUrl = process.env.NEXT_PUBLIC_DATABASE_URL?.replace("&channel_binding=require", "");

export default defineConfig({
  schema: "./src/lib/db/schema/*",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl!,
  },
});
