import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const client = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(client);

console.log('Running migrations...');

await migrate(db, { migrationsFolder: join(__dirname, 'migrations') });

console.log('Migrations completed!');

await client.end();
process.exit(0);
