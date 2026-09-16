import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Table témoin pour la validation de connectivité Neon (Sprint 0)
 * Le schéma complet sera implémenté lors du Sprint 1.
 */
export const systemChecks = pgTable('system_checks', {
  id: uuid('id').defaultRandom().primaryKey(),
  component: text('component').notNull(),
  status: text('status').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
