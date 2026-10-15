import { sql } from 'drizzle-orm'
import { check, pgPolicy, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { authenticatedRole, authUid, authUsers } from 'drizzle-orm/supabase'

export const zenStepProgress = pgTable(
  'zen_step_progress',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    trackId: text('track_id').notNull(),
    stepId: text('step_id').notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.trackId, table.stepId] }),
    check('zen_step_progress_track_length', sql`char_length(${table.trackId}) <= 60`),
    check('zen_step_progress_step_length', sql`char_length(${table.stepId}) <= 60`),
    pgPolicy('zen_step_progress_select_own', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy('zen_step_progress_insert_own', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy('zen_step_progress_delete_own', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
  ],
).enableRLS()
