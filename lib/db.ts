import { Pool } from "pg";
let pool: Pool | undefined;
export function db(): Pool { if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured"); pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 10, ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized:false } : undefined }); return pool; }
