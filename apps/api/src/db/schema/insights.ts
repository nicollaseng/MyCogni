import { insightAudiences } from '@mycogni/domain'
import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { authenticatedRole, authUid, authUsers } from 'drizzle-orm/supabase'

export const insightAudience = pgEnum('insight_audience', insightAudiences)

export const insights = pgTable(
  'insights',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    audience: insightAudience('audience').notNull(),
    professionalId: uuid('professional_id').references(() => authUsers.id, {
      onDelete: 'cascade',
    }),
    periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
    periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
    checkInCount: integer('check_in_count').notNull(),
    content: jsonb('content').notNull(),
    model: text('model').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      'insights_audience_target',
      sql`(${table.audience} = 'professional') = (${table.professionalId} is not null)`,
    ),
    index('insights_patient_created_idx').on(table.patientId, table.createdAt.desc()),
    index('insights_professional_idx').on(table.professionalId, table.createdAt.desc()),
    pgPolicy('insights_select_own', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.audience} = 'patient' and ${table.patientId} = ${authUid}`,
    }),
    pgPolicy('insights_select_linked_professional', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.audience} = 'professional'
        and ${table.professionalId} = ${authUid}
        and exists (
          select 1 from public.care_links cl
          where cl.patient_id = ${table.patientId}
            and cl.professional_id = ${authUid}
            and cl.ended_at is null
        )`,
    }),
  ],
).enableRLS()
