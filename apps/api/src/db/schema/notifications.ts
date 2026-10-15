import { notificationKinds } from '@mycogni/domain'
import { sql } from 'drizzle-orm'
import { index, pgEnum, pgPolicy, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { authenticatedRole, authUid, authUsers } from 'drizzle-orm/supabase'
import { invitations } from './invitations.ts'

export const notificationKind = pgEnum('notification_kind', notificationKinds)

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    kind: notificationKind('kind').notNull(),
    invitationId: uuid('invitation_id').references(() => invitations.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    readAt: timestamp('read_at', { withTimezone: true }),
  },
  (table) => [
    index('notifications_user_created_idx').on(table.userId, table.createdAt.desc()),
    pgPolicy('notifications_select_own', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy('notifications_update_own', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
  ],
).enableRLS()
