import { db } from '@allotech/db';
import * as schema from '@allotech/db/schema';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { bearer } from 'better-auth/plugins';

/**
 * Configuration Better Auth pour AlloTech
 * Supporte Administrateur (email/mot de passe) et Technicien (sessions, bearer pour mobile)
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      account: schema.accounts,
      session: schema.sessions,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [bearer()],
});

export { toNextJsHandler } from 'better-auth/next-js';
export type Auth = typeof auth;
