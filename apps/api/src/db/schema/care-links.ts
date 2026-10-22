import { sql } from 'drizzle-orm'
import {
  boolean,
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
import { invitations } from './invitations.ts'

export const careLinkEndedBy = pgEnum('care_link_ended_by', ['patient', 'professional', 'team'])

export const careLinks = pgTable(
  'care_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    professionalId: uuid('professional_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    invitationId: uuid('invitation_id').references(() => invitations.id, {
      onDelete: 'set null',
    }),
    sharesHistory: boolean('shares_history').notNull().default(false),
    consentVersion: text('consent_version').notNull(),
    consentAcceptedAt: timestamp('consent_accepted_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    endedBy: careLinkEndedBy('ended_by'),
  },
  (table) => [
    uniqueIndex('care_links_active_pair_key')
      .on(table.professionalId, table.patientId)
      .where(sql`ended_at is null`),
    index('care_links_patient_idx').on(table.patientId),
    pgPolicy('care_links_select_participants', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.professionalId} = ${authUid} or ${table.patientId} = ${authUid}`,
    }),
    pgPolicy('care_links_insert_by_patient', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${table.patientId} = ${authUid}
        and ${table.endedAt} is null
        and public.current_account_type() = 'patient'
        and exists (
          select 1 from public.invitations i
          where i.id = ${table.invitationId}
            and i.patient_id = ${authUid}
            and i.professional_id = ${table.professionalId}
            and i.status = 'accepted'
        )
        and public.is_verified_professional_id(${table.professionalId})`,
    }),
    pgPolicy('care_links_end_by_participant', {
      for: 'update',
      to: authenticatedRole,
      using: sql`(${table.professionalId} = ${authUid} or ${table.patientId} = ${authUid}) and ${table.endedAt} is null`,
      withCheck: sql`(${table.professionalId} = ${authUid} or ${table.patientId} = ${authUid}) and ${table.endedAt} is not null`,
    }),
  ],
).enableRLS()
