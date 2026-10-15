import { invitationChannels, invitationStatuses } from '@mycogni/domain'
import { sql } from 'drizzle-orm'
import { check, index, pgEnum, pgPolicy, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { authenticatedRole, authUid, authUsers } from 'drizzle-orm/supabase'

export const invitationStatus = pgEnum('invitation_status', invitationStatuses)

export const invitationChannel = pgEnum('invitation_channel', invitationChannels)

export const invitations = pgTable(
  'invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull().unique(),
    professionalId: uuid('professional_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    channel: invitationChannel('channel').notNull(),
    recipientEmail: text('recipient_email'),
    patientId: uuid('patient_id').references(() => authUsers.id, { onDelete: 'set null' }),
    status: invitationStatus('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    respondedAt: timestamp('responded_at', { withTimezone: true }),
  },
  (table) => [
    check(
      'invitations_lifetime',
      sql`${table.expiresAt} <= ${table.createdAt} + interval '72 hours'`,
    ),
    check(
      'invitations_email_channel',
      sql`${table.channel} <> 'email' or ${table.recipientEmail} is not null`,
    ),
    index('invitations_professional_idx').on(table.professionalId, table.createdAt.desc()),
    index('invitations_patient_idx').on(table.patientId),
    index('invitations_recipient_email_idx').on(sql`lower(${table.recipientEmail})`),
    pgPolicy('invitations_select_participants', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.professionalId} = ${authUid} or ${table.patientId} = ${authUid}`,
    }),
    pgPolicy('invitations_insert_verified_professional', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${table.professionalId} = ${authUid}
        and ${table.patientId} is null
        and ${table.status} = 'pending'
        and public.is_verified_professional()`,
    }),
    pgPolicy('invitations_cancel_by_professional', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${table.professionalId} = ${authUid} and ${table.status} = 'pending'`,
      withCheck: sql`${table.professionalId} = ${authUid} and ${table.status} = 'canceled'`,
    }),
    pgPolicy('invitations_respond_by_patient', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${table.patientId} = ${authUid} and ${table.status} = 'pending' and ${table.expiresAt} > now()`,
      withCheck: sql`${table.patientId} = ${authUid} and ${table.status} in ('accepted', 'declined')`,
    }),
  ],
).enableRLS()
