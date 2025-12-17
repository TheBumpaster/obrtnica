import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || 'postgresql://serp:serp_dev@localhost:5432/serp';

async function main() {
  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);

  console.log('Resetting database...');
  
  // Drop all tables
  await db.execute(sql`DROP SCHEMA public CASCADE;`);
  await db.execute(sql`CREATE SCHEMA public;`);
  
  console.log('Database reset complete!');
  
  await client.end();
  process.exit(0);
}

main().catch((err) => {
  console.error('Reset failed:', err);
  process.exit(1);
});
