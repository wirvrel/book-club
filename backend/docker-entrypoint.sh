#!/bin/sh
set -e

echo "Waiting for PostgreSQL to be ready..."
until node -e "
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
sql\`SELECT 1\`.then(() => { sql.end(); process.exit(0); }).catch(() => process.exit(1));
" 2>/dev/null; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "PostgreSQL is up - resetting database for fresh setup..."
node -e "
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
sql\`DROP SCHEMA IF EXISTS public CASCADE\`
  .then(() => sql\`DROP SCHEMA IF EXISTS drizzle CASCADE\`)
  .then(() => sql\`CREATE SCHEMA public\`)
  .then(() => { sql.end(); console.log('All schemas reset complete'); process.exit(0); })
  .catch((err) => { console.error('Reset failed:', err); sql.end(); process.exit(1); });
"

echo "Executing migrations..."
npx tsx src/server/db/migrate.ts

echo "Running seeder..."
npx tsx src/server/db/seeds/seed.ts
echo "Seeding completed!"

echo "Applying triggers and recalculating aggregates..."
npx tsx src/server/db/apply-triggers.ts
echo "Triggers applied!"

echo "Starting application..."
exec "$@"
