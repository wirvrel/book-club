import { client } from './index.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function applyTriggers() {
  console.log('🔄 Applying rating triggers and recalculating averages...');
  
  const sqlPath = join(__dirname, 'migrations', '0003_add_rating_triggers.sql');
  const sql = readFileSync(sqlPath, 'utf8');

  try {
    await client.unsafe(sql);
    console.log('✅ Triggers applied and ratings recalculated successfully!');
  } catch (error) {
    console.error('❌ Failed to apply triggers:', error);
  } finally {
    process.exit(0);
  }
}

applyTriggers();
