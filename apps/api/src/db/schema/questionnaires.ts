import { assignmentNoteMaxLength, assignmentStatuses, repeatIntervals } from '@mycogni/domain'
import { sql } from 'drizzle-orm'
import {
  check,
  index,
  jsonb,
  pgEnum,
  pgPolicy,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'
import { authenticatedRole, authUid, authUsers } from 'drizzle-orm/supabase'
import { careLinks } from './care-links.ts'

export const questionnaireAssignmentStatus = pgEnum(
  'questionnaire_assignment_status',
  assignmentStatuses,
)

const activeLinkOf = (careLinkId: AnyPgColumn) => sql`exists (
  select 1 from public.care_links cl
  where cl.id = ${careLinkId}
    and cl.professional_id = ${authUid}
    and cl.ended_at is null
)`

export const questionnaireAssignments = pgTable(
  'questionnaire_assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    professionalId: uuid('professional_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    careLinkId: uuid('care_link_id')
      .notNull()
      .references(() => careLinks.id, { onDelete: 'cascade' }),
    instrumentId: text('instrument_id').notNull(),
    variant: text('variant').notNull(),
    note: text('note'),
    repeatEveryDays: smallint('repeat_every_days'),
    availableFrom: timestamp('available_from', { withTimezone: true }).notNull().defaultNow(),
    status: questionnaireAssignmentStatus('status').notNull().default('assigned'),
    notifiedAt: timestamp('notified_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  },
  (table) => [
    check(
      'questionnaire_assignments_note_length',
      sql`char_length(${table.note}) <= ${sql.raw(String(assignmentNoteMaxLength))}`,
    ),
    check(
      'questionnaire_assignments_repeat',
      sql`${table.repeatEveryDays} is null or ${table.repeatEveryDays} in (${sql.raw(repeatIntervals.join(', '))})`,
    ),
    check(
      'questionnaire_assignments_instrument',
      sql`char_length(${table.instrumentId}) between 1 and 40 and char_length(${table.variant}) between 1 and 40`,
    ),
    check(
      'questionnaire_assignments_completed',
      sql`(${table.status} = 'completed') = (${table.completedAt} is not null)`,
    ),
    check(
      'questionnaire_assignments_cancelled',
      sql`(${table.status} = 'cancelled') = (${table.cancelledAt} is not null)`,
    ),
    index('questionnaire_assignments_patient_idx').on(table.patientId, table.availableFrom.desc()),
    index('questionnaire_assignments_professional_idx').on(
      table.professionalId,
      table.patientId,
      table.createdAt.desc(),
    ),
    index('questionnaire_assignments_link_idx').on(table.careLinkId),
    index('questionnaire_assignments_due_idx')
      .on(table.availableFrom)
      .where(sql`status = 'assigned' and notified_at is null`),
    uniqueIndex('questionnaire_assignments_one_open_key')
      .on(table.professionalId, table.patientId, table.variant)
      .where(sql`status in ('assigned', 'in_progress')`),
    pgPolicy('questionnaire_assignments_select_patient', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.patientId} = ${authUid}`,
    }),
    pgPolicy('questionnaire_assignments_select_professional', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.professionalId} = ${authUid} and ${activeLinkOf(table.careLinkId)}`,
    }),
    pgPolicy('questionnaire_assignments_insert_professional', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${table.professionalId} = ${authUid}
        and ${table.status} = 'assigned'
        and ${table.notifiedAt} is null
        and ${table.completedAt} is null
        and ${table.cancelledAt} is null
        and public.is_verified_professional()
        and exists (
          select 1 from public.care_links cl
          where cl.id = ${table.careLinkId}
            and cl.professional_id = ${authUid}
            and cl.patient_id = ${table.patientId}
            and cl.ended_at is null
        )`,
    }),
    pgPolicy('questionnaire_assignments_cancel_professional', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${table.professionalId} = ${authUid}
        and ${table.status} in ('assigned', 'in_progress')
        and ${activeLinkOf(table.careLinkId)}`,
      withCheck: sql`${table.professionalId} = ${authUid}
        and ${table.status} = 'cancelled'
        and ${table.cancelledAt} is not null`,
    }),
  ],
).enableRLS()

export const questionnaireResponses = pgTable(
  'questionnaire_responses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    assignmentId: uuid('assignment_id')
      .notNull()
      .unique()
      .references(() => questionnaireAssignments.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    instrumentId: text('instrument_id').notNull(),
    instrumentVersion: text('instrument_version').notNull(),
    locale: text('locale').notNull(),
    answers: jsonb('answers').notNull(),
    score: jsonb('score'),
    flags: text('flags')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    consentedAt: timestamp('consented_at', { withTimezone: true }).notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    check(
      'questionnaire_responses_locale',
      sql`${table.locale} in ('pt-BR', 'pt-PT', 'en-US', 'en-GB')`,
    ),
    check('questionnaire_responses_answers', sql`jsonb_typeof(${table.answers}) = 'array'`),
    check(
      'questionnaire_responses_completed',
      sql`(${table.completedAt} is null) = (${table.score} is null)`,
    ),
    index('questionnaire_responses_patient_idx').on(table.patientId, table.startedAt.desc()),
    pgPolicy('questionnaire_responses_select_patient', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.patientId} = ${authUid}`,
    }),
    pgPolicy('questionnaire_responses_select_professional', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.completedAt} is not null and exists (
        select 1 from public.questionnaire_assignments a
        join public.care_links cl on cl.id = a.care_link_id
        where a.id = ${table.assignmentId}
          and a.professional_id = ${authUid}
          and cl.professional_id = ${authUid}
          and cl.ended_at is null
      )`,
    }),
    pgPolicy('questionnaire_responses_insert_patient', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${table.patientId} = ${authUid}
        and public.current_account_type() = 'patient'
        and ${table.completedAt} is null
        and ${table.score} is null
        and ${table.flags} = '{}'::text[]
        and exists (
          select 1 from public.questionnaire_assignments a
          where a.id = ${table.assignmentId}
            and a.patient_id = ${authUid}
            and a.status = 'assigned'
            and a.available_from <= now()
        )`,
    }),
    pgPolicy('questionnaire_responses_update_patient', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${table.patientId} = ${authUid}
        and ${table.completedAt} is null
        and exists (
          select 1 from public.questionnaire_assignments a
          where a.id = ${table.assignmentId}
            and a.patient_id = ${authUid}
            and a.status = 'in_progress'
        )`,
      withCheck: sql`${table.patientId} = ${authUid}`,
    }),
  ],
).enableRLS()
