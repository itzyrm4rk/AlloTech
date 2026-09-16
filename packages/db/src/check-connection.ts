import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

async function checkConnection() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn('⚠️  DATABASE_URL non défini dans .env. Veuillez configurer votre instance Neon.');
    process.exit(0);
  }

  try {
    const sql = neon(databaseUrl);
    const result = await sql`SELECT 1 as connected`;
    if (result && result.length > 0) {
      console.log('✅ Connexion Neon PostgreSQL réussie ! Réponse :', result);
    }
  } catch (error) {
    console.error('❌ Erreur de connexion à Neon :', error);
    process.exit(1);
  }
}

checkConnection();
