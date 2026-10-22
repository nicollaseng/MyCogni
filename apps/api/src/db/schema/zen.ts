import { practiceKinds } from '@mycogni/domain'
import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgPolicy,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
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

export const zenSessionKind = pgEnum('zen_session_kind', practiceKinds)

export const zenSessions = pgTable(
  'zen_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    kind: zenSessionKind('kind').notNull(),
    contentId: text('content_id').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    secondsCompleted: integer('seconds_completed').notNull(),
    completed: boolean('completed').notNull().default(false),
    feelingAfter: smallint('feeling_after'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('zen_sessions_user_started_idx').on(table.userId, table.startedAt.desc()),
    check('zen_sessions_content_length', sql`char_length(${table.contentId}) <= 60`),
    check('zen_sessions_seconds_range', sql`${table.secondsCompleted} between 0 and 14400`),
    check(
      'zen_sessions_feeling_range',
      sql`${table.feelingAfter} is null or ${table.feelingAfter} between 0 and 6`,
    ),
    pgPolicy('zen_sessions_select_own', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy('zen_sessions_insert_own', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${authUid} and public.current_account_type() = 'patient'`,
    }),
    pgPolicy('zen_sessions_update_own', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
  ],
).enableRLS()
