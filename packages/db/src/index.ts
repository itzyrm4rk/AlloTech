import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error(
    '❌ DATABASE_URL manquant. Créez un fichier .env à la racine du projet et ajoutez votre URL Neon.',
  );
}

export const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

export * from './schema';
export type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
