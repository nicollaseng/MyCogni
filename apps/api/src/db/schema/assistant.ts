import { assistantModes, assistantRoles, riskLevels } from '@mycogni/domain'
import { sql, type SQL } from 'drizzle-orm'
import {
  check,
  index,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'
import { authenticatedRole, authUid, authUsers } from 'drizzle-orm/supabase'

export const assistantMode = pgEnum('assistant_mode', assistantModes)

export const assistantRole = pgEnum('assistant_role', assistantRoles)

export const assistantRisk = pgEnum('assistant_risk', riskLevels)

function allowedScope(mode: AnyPgColumn, patientId: AnyPgColumn): SQL {
  return sql`(${mode} = 'personal' or exists (
    select 1 from public.care_links cl
    join public.professional_profiles pp on pp.user_id = cl.professional_id
    where cl.professional_id = ${authUid}
      and cl.patient_id = ${patientId}
      and cl.ended_at is null
      and pp.status = 'verified'
  ))`
}

export const assistantConversations = pgTable(
  'assistant_conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    mode: assistantMode('mode').notNull(),
    patientId: uuid('patient_id').references(() => authUsers.id, { onDelete: 'cascade' }),
    risk: assistantRisk('risk').notNull().default('none'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      'assistant_conversations_mode_target',
      sql`(${table.mode} = 'professional') = (${table.patientId} is not null)`,
    ),
    check('assistant_conversations_not_self', sql`${table.patientId} <> ${table.ownerId}`),
    index('assistant_conversations_owner_idx').on(table.ownerId, table.updatedAt.desc()),
    index('assistant_conversations_patient_idx').on(table.patientId),
    pgPolicy('assistant_conversations_select_own', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.ownerId} = ${authUid} and ${allowedScope(table.mode, table.patientId)}`,
    }),
    pgPolicy('assistant_conversations_insert_own', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${table.ownerId} = ${authUid} and ${allowedScope(table.mode, table.patientId)}`,
    }),
    pgPolicy('assistant_conversations_update_own', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${table.ownerId} = ${authUid} and ${allowedScope(table.mode, table.patientId)}`,
      withCheck: sql`${table.ownerId} = ${authUid}`,
    }),
    pgPolicy('assistant_conversations_delete_own', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`${table.ownerId} = ${authUid}`,
    }),
  ],
).enableRLS()

export const assistantMessages = pgTable(
  'assistant_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => assistantConversations.id, { onDelete: 'cascade' }),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    role: assistantRole('role').notNull(),
    content: text('content').notNull(),
    risk: assistantRisk('risk').notNull().default('none'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      'assistant_messages_content_length',
      sql`char_length(${table.content}) between 1 and 4000`,
    ),
    index('assistant_messages_conversation_idx').on(table.conversationId, table.createdAt),
    pgPolicy('assistant_messages_select_own', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.ownerId} = ${authUid} and exists (
        select 1 from public.assistant_conversations c where c.id = ${table.conversationId}
      )`,
    }),
    pgPolicy('assistant_messages_insert_own', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${table.ownerId} = ${authUid} and exists (
        select 1 from public.assistant_conversations c
        where c.id = ${table.conversationId} and c.owner_id = ${authUid}
      )`,
    }),
  ],
).enableRLS()
