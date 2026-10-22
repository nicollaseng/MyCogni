import { dataExportStatuses } from '@mycogni/domain'
import { sql } from 'drizzle-orm'
import {
  bigint,
  index,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { authenticatedRole, authUid, authUsers } from 'drizzle-orm/supabase'

export const dataExportStatus = pgEnum('data_export_status', dataExportStatuses)

export const dataExports = pgTable(
  'data_exports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    status: dataExportStatus('status').notNull().default('queued'),
    requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    readyAt: timestamp('ready_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    storagePath: text('storage_path'),
    sizeBytes: bigint('size_bytes', { mode: 'number' }),
    error: text('error'),
  },
  (table) => [
    index('data_exports_user_requested_idx').on(table.userId, table.requestedAt.desc()),
    index('data_exports_expiry_idx').on(table.status, table.expiresAt),
    uniqueIndex('data_exports_one_active_idx')
      .on(table.userId)
      .where(sql`${table.status} in ('queued', 'running')`),
    pgPolicy('data_exports_select_own', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
  ],
).enableRLS()
