import { neon, NeonQueryFunction } from "@neondatabase/serverless";

let sqlClient: NeonQueryFunction<false, false> | null = null;

export function getDb() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || !dbUrl.startsWith("postgres")) {
    return null;
  }
  if (!sqlClient) {
    sqlClient = neon(dbUrl);
  }
  return sqlClient;
}

export async function initDb() {
  const sql = getDb();
  if (!sql) return false;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS watchlists (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL DEFAULT 'default_user',
        ticker VARCHAR(10) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT unique_user_ticker UNIQUE(user_id, ticker)
      );
    `;
    return true;
  } catch (err) {
    console.error("Neon DB Init Failed, operating in fallback mode:", err);
    return false;
  }
}
