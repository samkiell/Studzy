import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const dbUrl = (process.env.DATABASE_URL || process.env.NEXT_PUBLIC_DATABASE_URL || "").replace("&channel_binding=require", "");
const sql = neon(dbUrl);
export const db = drizzle({ client: sql, schema });
