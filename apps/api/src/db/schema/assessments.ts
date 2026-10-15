import { instrumentIds, severities } from '@mycogni/domain'
import { sql } from 'drizzle-orm'
import {
  boolean,
  index,
  pgEnum,
  pgPolicy,
  pgTable,
  smallint,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { authenticatedRole, authUid, authUsers } from 'drizzle-orm/supabase'

export const assessmentInstrument = pgEnum('assessment_instrument', instrumentIds)

export const assessmentSeverity = pgEnum('assessment_severity', severities)

export const assessments = pgTable(
  'assessments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    instrument: assessmentInstrument('instrument').notNull(),
    answers: smallint('answers').array().notNull(),
    totalScore: smallint('total_score').notNull(),
    severity: assessmentSeverity('severity').notNull(),
    hasRiskFlag: boolean('has_risk_flag').notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('assessments_user_completed_idx').on(table.userId, table.completedAt.desc()),
    pgPolicy('assessments_select_own', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy('assessments_select_linked_professional', {
      for: 'select',
      to: authenticatedRole,
      using: sql`exists (
        select 1 from public.care_links cl
        where cl.patient_id = ${table.userId}
          and cl.professional_id = ${authUid}
          and cl.ended_at is null
          and (cl.shares_history or ${table.completedAt} >= cl.started_at)
      )`,
    }),
    pgPolicy('assessments_insert_own', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
  ],
).enableRLS()
