import { alertLevels, alertReasons } from '@mycogni/domain'
import { sql } from 'drizzle-orm'
import {
  index,
  pgEnum,
  pgPolicy,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'
import { authenticatedRole, authUid, authUsers } from 'drizzle-orm/supabase'
import { careLinks } from './care-links.ts'
import { checkIns } from './check-ins.ts'
import { journalEntries } from './journal.ts'

export const alertReason = pgEnum('alert_reason', alertReasons)

export const alertLevel = pgEnum('alert_level', alertLevels)

const activeLinkOf = (careLinkId: AnyPgColumn) => sql`exists (
  select 1 from public.care_links cl
  where cl.id = ${careLinkId}
    and cl.professional_id = ${authUid}
    and cl.ended_at is null
)`

export const professionalAlerts = pgTable(
  'professional_alerts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    careLinkId: uuid('care_link_id')
      .notNull()
      .references(() => careLinks.id, { onDelete: 'cascade' }),
    professionalId: uuid('professional_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    reason: alertReason('reason').notNull(),
    level: alertLevel('level').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    emailedAt: timestamp('emailed_at', { withTimezone: true }),
    checkInId: uuid('check_in_id').references(() => checkIns.id, { onDelete: 'set null' }),
    journalEntryId: uuid('journal_entry_id').references(() => journalEntries.id, {
      onDelete: 'set null',
    }),
  },
  (table) => [
    uniqueIndex('professional_alerts_open_key')
      .on(table.careLinkId, table.reason)
      .where(sql`resolved_at is null`),
    index('professional_alerts_professional_created_idx').on(
      table.professionalId,
      table.createdAt.desc(),
    ),
    index('professional_alerts_emailed_idx')
      .on(table.professionalId, table.patientId, table.emailedAt)
      .where(sql`emailed_at is not null`),
    pgPolicy('professional_alerts_select_own_link', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.professionalId} = ${authUid} and ${activeLinkOf(table.careLinkId)}`,
    }),
    pgPolicy('professional_alerts_update_open_own_link', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${table.professionalId} = ${authUid} and ${table.resolvedAt} is null and ${activeLinkOf(table.careLinkId)}`,
      withCheck: sql`${table.professionalId} = ${authUid}`,
    }),
  ],
).enableRLS()
