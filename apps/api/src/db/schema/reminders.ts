import { reminderDefaults } from '@mycogni/domain'
import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  date,
  index,
  pgPolicy,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { authenticatedRole, authUid, authUsers } from 'drizzle-orm/supabase'

export const reminderSettings = pgTable(
  'reminder_settings',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    enabled: boolean('enabled').notNull().default(reminderDefaults.enabled),
    time: text('time').notNull().default(reminderDefaults.time),
    days: smallint('days')
      .array()
      .notNull()
      .default(sql`'{0,1,2,3,4,5,6}'::smallint[]`),
    push: boolean('push').notNull().default(reminderDefaults.push),
    email: boolean('email').notNull().default(reminderDefaults.email),
    lastSentOn: date('last_sent_on', { mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    check('reminder_settings_time', sql`${table.time} ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'`),
    check(
      'reminder_settings_days',
      sql`cardinality(${table.days}) between 1 and 7 and ${table.days} <@ '{0,1,2,3,4,5,6}'::smallint[]`,
    ),
    index('reminder_settings_enabled_idx').on(table.enabled),
    pgPolicy('reminder_settings_select_own', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy('reminder_settings_insert_own', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${authUid} and public.current_account_type() = 'patient'`,
    }),
    pgPolicy('reminder_settings_update_own', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy('reminder_settings_delete_own', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
  ],
).enableRLS()

export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    endpoint: text('endpoint').notNull().unique('push_subscriptions_endpoint_key'),
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  },
  (table) => [
    index('push_subscriptions_user_idx').on(table.userId),
    pgPolicy('push_subscriptions_select_own', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy('push_subscriptions_delete_own', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
  ],
).enableRLS()
