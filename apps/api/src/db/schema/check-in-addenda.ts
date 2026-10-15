import { checkInLimits } from '@mycogni/domain'
import { sql } from 'drizzle-orm'
import { check, index, pgPolicy, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { authenticatedRole, authUid, authUsers } from 'drizzle-orm/supabase'
import { checkIns } from './check-ins.ts'

export const checkInAddenda = pgTable(
  'check_in_addenda',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    checkInId: uuid('check_in_id')
      .notNull()
      .references(() => checkIns.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    text: text('text').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      'check_in_addenda_text_length',
      sql`char_length(${table.text}) between 1 and ${sql.raw(String(checkInLimits.addendum))}`,
    ),
    index('check_in_addenda_check_in_created_idx').on(table.checkInId, table.createdAt),
    pgPolicy('check_in_addenda_select_own', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy('check_in_addenda_select_shared_check_in', {
      for: 'select',
      to: authenticatedRole,
      using: sql`exists (
        select 1 from public.check_ins ci
        where ci.id = ${table.checkInId}
          and ci.user_id = ${table.userId}
      )`,
    }),
    pgPolicy('check_in_addenda_insert_own', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${authUid}
        and public.current_account_type() = 'patient'
        and exists (
          select 1 from public.check_ins ci
          where ci.id = ${table.checkInId}
            and ci.user_id = ${authUid}
        )`,
    }),
  ],
).enableRLS()
