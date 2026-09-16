import { db } from '@allotech/db';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

/**
 * Configuration Better Auth pour AlloTech
 * Supporte Administrateur (email) et Technicien (matricule)
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
  },
});

export type Auth = typeof auth;
