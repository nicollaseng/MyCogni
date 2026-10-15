import { sql } from 'drizzle-orm'
import {
  check,
  index,
  pgPolicy,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { authenticatedRole, authUid, authUsers } from 'drizzle-orm/supabase'

export const checkIns = pgTable(
  'check_ins',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    moodLevel: smallint('mood_level').notNull(),
    emotions: text('emotions')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    contexts: text('contexts')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    note: text('note'),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('check_ins_mood_level_range', sql`${table.moodLevel} between 0 and 6`),
    index('check_ins_user_recorded_idx').on(table.userId, table.recordedAt.desc()),
    pgPolicy('check_ins_select_own', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy('check_ins_insert_own', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
  ],
).enableRLS()
