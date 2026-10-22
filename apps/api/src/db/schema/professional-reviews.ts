import { professionalDocumentLimits } from '@mycogni/domain'
import { sql } from 'drizzle-orm'
import { check, index, pgPolicy, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { authenticatedRole, authUid, authUsers } from 'drizzle-orm/supabase'
import { professionalStatus } from './professionals.ts'

export const professionalReviews = pgTable(
  'professional_reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    professionalId: uuid('professional_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    adminId: uuid('admin_id').references(() => authUsers.id, { onDelete: 'set null' }),
    decision: professionalStatus('decision').notNull(),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('professional_reviews_decision', sql`${table.decision} <> 'pending'`),
    check(
      'professional_reviews_note_length',
      sql`char_length(${table.note}) <= ${sql.raw(String(professionalDocumentLimits.reviewNote))}`,
    ),
    index('professional_reviews_professional_created_idx').on(
      table.professionalId,
      table.createdAt.desc(),
    ),
    pgPolicy('professional_reviews_select_admin', {
      for: 'select',
      to: authenticatedRole,
      using: sql`public.is_admin()`,
    }),
    pgPolicy('professional_reviews_select_own', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.professionalId} = ${authUid}`,
    }),
  ],
).enableRLS()
