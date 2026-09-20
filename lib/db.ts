import { Pool } from "pg";
let pool: Pool | undefined;
export function db(): Pool { if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured"); pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 10, ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized:false } : undefined }); return pool; }
export async function withTransaction<T>(fn:(client: import("pg").PoolClient)=>Promise<T>):Promise<T> { const client=await db().connect(); try { await client.query("BEGIN"); const result=await fn(client); await client.query("COMMIT"); return result; } catch(error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); } }
