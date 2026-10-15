import {
  locales,
  supportAttachmentBucket,
  supportAttachmentLimits,
  supportAttachmentTypes,
  supportLimits,
  supportRequesterRoles,
  supportSubjects,
  supportTicketStatuses,
  type Locale,
  type SupportAttachmentType,
} from '@mycogni/domain'
import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { authenticatedRole, authUid, authUsers } from 'drizzle-orm/supabase'

export const supportSubject = pgEnum('support_subject', supportSubjects)

export const supportTicketStatus = pgEnum('support_ticket_status', supportTicketStatuses)

export const supportRequesterRole = pgEnum('support_requester_role', supportRequesterRoles)

function listOf(values: readonly string[]) {
  return sql.raw(values.map((value) => `'${value}'`).join(', '))
}

function bytes(value: number) {
  return sql.raw(String(value))
}

export const supportTickets = pgTable(
  'support_tickets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    number: integer('number').notNull().unique().generatedAlwaysAsIdentity({ startWith: 1001 }),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    requesterRole: supportRequesterRole('requester_role').notNull(),
    subject: supportSubject('subject').notNull(),
    customSubject: text('custom_subject'),
    message: text('message').notNull(),
    attachmentPath: text('attachment_path').unique(),
    attachmentName: text('attachment_name'),
    attachmentType: text('attachment_type').$type<SupportAttachmentType>(),
    attachmentSize: integer('attachment_size'),
    status: supportTicketStatus('status').notNull().default('pending'),
    locale: text('locale').$type<Locale>().notNull(),
    closingNote: text('closing_note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    takenAt: timestamp('taken_at', { withTimezone: true }),
    takenBy: uuid('taken_by').references(() => authUsers.id, { onDelete: 'set null' }),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    closedBy: uuid('closed_by').references(() => authUsers.id, { onDelete: 'set null' }),
  },
  (table) => [
    check(
      'support_tickets_custom_subject',
      sql`(${table.subject} = 'other') = (${table.customSubject} is not null)
        and char_length(${table.customSubject}) between ${bytes(supportLimits.customSubjectMin)} and ${bytes(supportLimits.customSubjectMax)}`,
    ),
    check(
      'support_tickets_message_length',
      sql`char_length(${table.message}) between ${bytes(supportLimits.messageMin)} and ${bytes(supportLimits.messageMax)}`,
    ),
    check(
      'support_tickets_attachment_complete',
      sql`num_nulls(${table.attachmentPath}, ${table.attachmentName}, ${table.attachmentType}, ${table.attachmentSize}) in (0, 4)`,
    ),
    check(
      'support_tickets_attachment_type',
      sql`${table.attachmentType} in (${listOf(supportAttachmentTypes)})`,
    ),
    check(
      'support_tickets_attachment_size',
      sql`${table.attachmentSize} between 1 and case when ${table.attachmentType} like 'image/%' then ${bytes(supportAttachmentLimits.imageBytes)} else ${bytes(supportAttachmentLimits.fileBytes)} end`,
    ),
    check(
      'support_tickets_attachment_name_length',
      sql`char_length(${table.attachmentName}) between 1 and ${bytes(supportAttachmentLimits.fileName)}`,
    ),
    check('support_tickets_locale', sql`${table.locale} in (${listOf(locales)})`),
    check(
      'support_tickets_closing_note_length',
      sql`char_length(${table.closingNote}) <= ${bytes(supportLimits.closingNote)}`,
    ),
    check(
      'support_tickets_closed_at',
      sql`(${table.status} = 'closed') = (${table.closedAt} is not null)`,
    ),
    index('support_tickets_user_created_idx').on(table.userId, table.createdAt.desc()),
    index('support_tickets_status_created_idx').on(table.status, table.createdAt.desc()),
    pgPolicy('support_tickets_select_own', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy('support_tickets_select_admin', {
      for: 'select',
      to: authenticatedRole,
      using: sql`public.is_admin()`,
    }),
    pgPolicy('support_tickets_insert_own', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${authUid}
        and ${table.status} = 'pending'
        and ${table.createdAt} = now()
        and num_nulls(${table.takenAt}, ${table.takenBy}, ${table.closedAt}, ${table.closedBy}, ${table.closingNote}) = 5
        and (
          ${table.requesterRole} = 'patient'
          or exists (select 1 from public.professional_profiles p where p.user_id = ${authUid})
        )
        and (
          ${table.attachmentPath} is null
          or (
            split_part(${table.attachmentPath}, '/', 1) = ${authUid}::text
            and exists (
              select 1 from storage.objects o
              where o.bucket_id = '${sql.raw(supportAttachmentBucket)}'
                and o.name = ${table.attachmentPath}
                and o.metadata ->> 'mimetype' = ${table.attachmentType}
                and (o.metadata ->> 'size')::bigint = ${table.attachmentSize}
            )
          )
        )`,
    }),
  ],
).enableRLS()
