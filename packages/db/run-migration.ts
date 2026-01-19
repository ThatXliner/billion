import 'dotenv/config';
import pg from 'pg';

const client = new pg.Client({
  connectionString: process.env.POSTGRES_URL,
});

async function runMigration() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Add article_generations column to all three tables
    const migrations = [
      `ALTER TABLE bill ADD COLUMN IF NOT EXISTS article_generations jsonb DEFAULT '[]'::jsonb`,
      `ALTER TABLE court_case ADD COLUMN IF NOT EXISTS article_generations jsonb DEFAULT '[]'::jsonb`,
      `ALTER TABLE government_content ADD COLUMN IF NOT EXISTS article_generations jsonb DEFAULT '[]'::jsonb`,
    ];

    for (const migration of migrations) {
      console.log(`Running: ${migration}`);
      await client.query(migration);
      console.log('✓ Success');
    }

    console.log('\n✅ All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
