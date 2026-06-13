const { Client } = require('pg');

const connectionString = 'postgres://postgres:y6evZ7IPMrG2aEi9@db.giznbbrfbnsxflfsmefr.supabase.co:5432/postgres';

const client = new Client({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database successfully!');
    
    // Add login_passcode column if not exists
    const res = await client.query(`
      ALTER TABLE public.registries ADD COLUMN IF NOT EXISTS login_passcode text;
    `);
    console.log('ALTER TABLE response:', res);
    
    // Check table columns to verify
    const checkRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'registries';
    `);
    console.log('Columns in registries table:', checkRes.rows);
  } catch (err) {
    console.error('Database connection/query error:', err);
  } finally {
    await client.end();
  }
}

run();
