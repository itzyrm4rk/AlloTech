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
  advanced: {
    disableCSRFCheck: true,
  },
  trustedOrigins: (request) => {
    const origin = request?.headers?.get('origin');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL;
    const base = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://10.0.2.2:3000',
      'http://192.168.1.169:3000',
      'http://192.168.1.169:8081',
      'exp://',
    ];
    if (appUrl) {
      base.push(appUrl.replace(/\/$/, ''));
    }
    if (origin) {
      if (
        origin.endsWith('.vercel.app') ||
        origin.startsWith('https://') ||
        origin.startsWith('http://192.168.') ||
        origin.startsWith('http://10.') ||
        origin.startsWith('http://172.') ||
        origin.startsWith('exp://')
      ) {
        return [...base, origin];
      }
    }
    return base;
  },
  plugins: [bearer()],
});

export { toNextJsHandler } from 'better-auth/next-js';
export { hashPassword, verifyPassword } from 'better-auth/crypto';
export type Auth = typeof auth;
