import {
  professionalDocumentLimits,
  professionalKinds,
  professionalStatuses,
} from '@mycogni/domain'
import { sql } from 'drizzle-orm'
import { check, pgEnum, pgPolicy, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { authenticatedRole, authUid, authUsers } from 'drizzle-orm/supabase'

export const professionalKind = pgEnum('professional_kind', professionalKinds)

export const professionalStatus = pgEnum('professional_status', professionalStatuses)

export const professionalProfiles = pgTable(
  'professional_profiles',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    kind: professionalKind('kind').notNull(),
    fullName: text('full_name').notNull(),
    registration: text('registration'),
    status: professionalStatus('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    reviewNote: text('review_note'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    emergencyWhatsapp: text('emergency_whatsapp'),
  },
  (table) => [
    check(
      'professional_profiles_review_note_length',
      sql`char_length(${table.reviewNote}) <= ${sql.raw(String(professionalDocumentLimits.reviewNote))}`,
    ),
    check(
      'professional_profiles_emergency_whatsapp_format',
      sql`${table.emergencyWhatsapp} ~ '^\\+[1-9][0-9]{7,14}$'`,
    ),
    pgPolicy('professional_profiles_select_own', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy('professional_profiles_select_by_invited_patients', {
      for: 'select',
      to: authenticatedRole,
      using: sql`exists (select 1 from public.invitations i where i.professional_id = ${table.userId} and i.patient_id = ${authUid})
        or exists (select 1 from public.care_links cl where cl.professional_id = ${table.userId} and cl.patient_id = ${authUid})`,
    }),
    pgPolicy('professional_profiles_insert_own_pending', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${authUid}
        and ${table.status} = 'pending'
        and ${table.verifiedAt} is null
        and public.current_account_type() = 'professional'`,
    }),
    pgPolicy('professional_profiles_update_own_name', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
  ],
).enableRLS()
