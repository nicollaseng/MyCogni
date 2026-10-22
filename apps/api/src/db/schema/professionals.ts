import {
  brazilianStates,
  professionalCouncils,
  professionalDocumentLimits,
  professionalKinds,
  professionalStatuses,
} from '@mycogni/domain'
import { sql } from 'drizzle-orm'
import {
  check,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { authenticatedRole, authUid, authUsers } from 'drizzle-orm/supabase'

export const professionalKind = pgEnum('professional_kind', professionalKinds)

export const professionalStatus = pgEnum('professional_status', professionalStatuses)

export const professionalCouncil = pgEnum('professional_council', professionalCouncils)

const states = sql.raw(brazilianStates.map((state) => `'${state}'`).join(', '))

export const professionalProfiles = pgTable(
  'professional_profiles',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    kind: professionalKind('kind').notNull(),
    fullName: text('full_name').notNull(),
    registrationText: text('registration'),
    registrationCouncil: professionalCouncil('registration_council'),
    registrationUf: text('registration_uf'),
    registrationNumber: text('registration_number'),
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
    check('professional_profiles_registration_uf', sql`${table.registrationUf} in (${states})`),
    check(
      'professional_profiles_registration_number',
      sql`${table.registrationNumber} ~ '^[0-9]{4,8}$'`,
    ),
    check(
      'professional_profiles_registration_parts',
      sql`(${table.registrationCouncil} is null) = (${table.registrationUf} is null)
        and (${table.registrationCouncil} is null) = (${table.registrationNumber} is null)`,
    ),
    check(
      'professional_profiles_registration_council',
      sql`${table.registrationCouncil} is null
        or (${table.registrationCouncil} = 'crp' and ${table.kind} = 'psychologist')
        or (${table.registrationCouncil} = 'crm' and ${table.kind} in ('psychiatrist', 'physician'))`,
    ),
    uniqueIndex('professional_profiles_registration_key')
      .on(
        table.registrationCouncil,
        sql`public.registration_scope(registration_council, registration_uf)`,
        sql`ltrim(registration_number, '0')`,
      )
      .where(sql`status <> 'rejected' and registration_council is not null`),
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
      withCheck: sql`${table.userId} = ${authUid}
        and not exists (
          select 1 from public.locked_identity() l
          where l.full_name is distinct from ${table.fullName}
        )`,
    }),
  ],
).enableRLS()
