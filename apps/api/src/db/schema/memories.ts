import { memoryKinds, memoryLimits, memoryOrigins, memoryStatuses } from '@mycogni/domain'
import { sql } from 'drizzle-orm'
import {
  check,
  index,
  pgEnum,
  pgPolicy,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'
import { authenticatedRole, authUid, authUsers } from 'drizzle-orm/supabase'
import { assistantMessages } from './assistant.ts'
import { checkInAddenda } from './check-in-addenda.ts'
import { checkIns } from './check-ins.ts'
import { journalEntries } from './journal.ts'

export const memoryKind = pgEnum('memory_kind', memoryKinds)

export const memoryOrigin = pgEnum('memory_origin', memoryOrigins)

export const memoryStatus = pgEnum('memory_status', memoryStatuses)

export const assistantMemories = pgTable(
  'assistant_memories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    kind: memoryKind('kind').notNull(),
    origin: memoryOrigin('origin').notNull(),
    importance: smallint('importance').notNull().default(2),
    status: memoryStatus('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  },
  (table) => [
    check(
      'assistant_memories_content_length',
      sql`char_length(${table.content}) between 1 and ${sql.raw(String(memoryLimits.content))}`,
    ),
    check('assistant_memories_importance', sql`${table.importance} between 1 and 3`),
    index('assistant_memories_user_idx').on(table.userId, table.status, table.createdAt.desc()),
    pgPolicy('assistant_memories_select_own', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy('assistant_memories_insert_own', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${authUid} and public.current_account_type() = 'patient'`,
    }),
    pgPolicy('assistant_memories_update_own', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy('assistant_memories_delete_own', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
  ],
).enableRLS()

export const assistantMemorySources = pgTable(
  'assistant_memory_sources',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    memoryId: uuid('memory_id')
      .notNull()
      .references(() => assistantMemories.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    checkInId: uuid('check_in_id').references(() => checkIns.id, { onDelete: 'cascade' }),
    checkInAddendumId: uuid('check_in_addendum_id').references(() => checkInAddenda.id, {
      onDelete: 'cascade',
    }),
    journalEntryId: uuid('journal_entry_id').references(() => journalEntries.id, {
      onDelete: 'cascade',
    }),
    assistantMessageId: uuid('assistant_message_id').references(() => assistantMessages.id, {
      onDelete: 'cascade',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      'assistant_memory_sources_one_source',
      sql`num_nonnulls(${table.checkInId}, ${table.checkInAddendumId}, ${table.journalEntryId}, ${table.assistantMessageId}) = 1`,
    ),
    unique('assistant_memory_sources_unique')
      .on(
        table.memoryId,
        table.checkInId,
        table.checkInAddendumId,
        table.journalEntryId,
        table.assistantMessageId,
      )
      .nullsNotDistinct(),
    index('assistant_memory_sources_memory_idx').on(table.memoryId),
    index('assistant_memory_sources_check_in_idx').on(table.checkInId),
    index('assistant_memory_sources_addendum_idx').on(table.checkInAddendumId),
    index('assistant_memory_sources_journal_idx').on(table.journalEntryId),
    index('assistant_memory_sources_message_idx').on(table.assistantMessageId),
    pgPolicy('assistant_memory_sources_select_own', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy('assistant_memory_sources_insert_own', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${authUid}
        and exists (
          select 1 from public.assistant_memories m
          where m.id = ${table.memoryId} and m.user_id = ${authUid}
        )
        and (${table.checkInId} is null or exists (
          select 1 from public.check_ins ci
          where ci.id = ${table.checkInId} and ci.user_id = ${authUid}
        ))
        and (${table.checkInAddendumId} is null or exists (
          select 1 from public.check_in_addenda ad
          where ad.id = ${table.checkInAddendumId} and ad.user_id = ${authUid}
        ))
        and (${table.journalEntryId} is null or exists (
          select 1 from public.journal_entries e
          where e.id = ${table.journalEntryId} and e.user_id = ${authUid}
        ))
        and (${table.assistantMessageId} is null or exists (
          select 1 from public.assistant_messages am
          join public.assistant_conversations c on c.id = am.conversation_id
          where am.id = ${table.assistantMessageId}
            and am.owner_id = ${authUid}
            and c.mode = 'personal'
        ))`,
    }),
    pgPolicy('assistant_memory_sources_delete_own', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
  ],
).enableRLS()
