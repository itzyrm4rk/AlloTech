import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });
dotenv.config();
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { fetch as undiciFetch } from 'undici';
import * as schema from './schema';

neonConfig.fetchFunction = undiciFetch as unknown as typeof fetch;

const databaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://allotech_user:placeholder@ep-placeholder.eu-central-1.aws.neon.tech/neondb?sslmode=require';

export const sql = neon(databaseUrl);
export const db = drizzle(sql, { schema });

export * from './schema';
export { schema };
export {
  eq,
  and,
  or,
  desc,
  asc,
  inArray,
  ilike,
  gt,
  gte,
  lt,
  lte,
  sql as sqlHelper,
} from 'drizzle-orm';
export type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
