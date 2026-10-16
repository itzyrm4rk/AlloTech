import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });
import { neon } from '@neondatabase/serverless';

async function init() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL missing');
    process.exit(1);
  }

  const sql = neon(dbUrl);

  await sql`
    CREATE TABLE IF NOT EXISTS matricules_autorises (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      matricule text NOT NULL UNIQUE,
      is_utilise boolean NOT NULL DEFAULT false,
      created_at timestamp NOT NULL DEFAULT now()
    );
  `;

  console.log('Table matricules_autorises créée ou déjà existante.');
}

init().catch(console.error);
