import { journalShareScopes } from '@mycogni/domain'
import { sql } from 'drizzle-orm'
import {
  check,
  index,
  jsonb,
  pgEnum,
  pgPolicy,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { authenticatedRole, authUid, authUsers } from 'drizzle-orm/supabase'
import { careLinks } from './care-links.ts'

export const journalEntries = pgTable(
  'journal_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    title: text('title'),
    body: jsonb('body')
      .notNull()
      .default(sql`'{"type":"doc","content":[]}'::jsonb`),
    plainText: text('plain_text').notNull().default(''),
    imagePaths: text('image_paths')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('journal_entries_title_length', sql`char_length(${table.title}) <= 200`),
    check('journal_entries_text_length', sql`char_length(${table.plainText}) <= 100000`),
    check('journal_entries_body_size', sql`octet_length(${table.body}::text) <= 600000`),
    check('journal_entries_image_count', sql`cardinality(${table.imagePaths}) <= 30`),
    index('journal_entries_user_updated_idx').on(table.userId, table.updatedAt.desc()),
    pgPolicy('journal_entries_select_own', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy('journal_entries_select_shared', {
      for: 'select',
      to: authenticatedRole,
      using: sql`public.can_read_shared_journal_entry(${table.id}, ${table.userId})`,
    }),
    pgPolicy('journal_entries_insert_own', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy('journal_entries_update_own', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy('journal_entries_delete_own', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
  ],
).enableRLS()

export const journalShareScope = pgEnum('journal_share_scope', journalShareScopes)

export const journalShares = pgTable(
  'journal_shares',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    professionalId: uuid('professional_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    careLinkId: uuid('care_link_id')
      .notNull()
      .references(() => careLinks.id, { onDelete: 'cascade' }),
    scope: journalShareScope('scope').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('journal_shares_patient_idx').on(table.patientId),
    index('journal_shares_professional_idx').on(table.professionalId),
    pgPolicy('journal_shares_select_participants', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.patientId} = ${authUid} or ${table.professionalId} = ${authUid}`,
    }),
    pgPolicy('journal_shares_insert_by_patient', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${table.patientId} = ${authUid}
        and ${table.revokedAt} is null
        and exists (
          select 1 from public.care_links cl
          where cl.id = ${table.careLinkId}
            and cl.patient_id = ${authUid}
            and cl.professional_id = ${table.professionalId}
            and cl.ended_at is null
        )`,
    }),
    pgPolicy('journal_shares_revoke_by_patient', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${table.patientId} = ${authUid}`,
      withCheck: sql`${table.patientId} = ${authUid}`,
    }),
  ],
).enableRLS()

export const journalShareEntries = pgTable(
  'journal_share_entries',
  {
    shareId: uuid('share_id')
      .notNull()
      .references(() => journalShares.id, { onDelete: 'cascade' }),
    entryId: uuid('entry_id')
      .notNull()
      .references(() => journalEntries.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.shareId, table.entryId] }),
    index('journal_share_entries_entry_idx').on(table.entryId),
    pgPolicy('journal_share_entries_select_participants', {
      for: 'select',
      to: authenticatedRole,
      using: sql`exists (
        select 1 from public.journal_shares s
        where s.id = ${table.shareId}
          and (s.patient_id = ${authUid} or s.professional_id = ${authUid})
      )`,
    }),
    pgPolicy('journal_share_entries_insert_by_patient', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`exists (
          select 1 from public.journal_shares s
          where s.id = ${table.shareId} and s.patient_id = ${authUid} and s.scope = 'entries'
        )
        and exists (
          select 1 from public.journal_entries e
          where e.id = ${table.entryId} and e.user_id = ${authUid}
        )`,
    }),
  ],
).enableRLS()

export const journalAccessLog = pgTable(
  'journal_access_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    shareId: uuid('share_id')
      .notNull()
      .references(() => journalShares.id, { onDelete: 'cascade' }),
    entryId: uuid('entry_id')
      .notNull()
      .references(() => journalEntries.id, { onDelete: 'cascade' }),
    professionalId: uuid('professional_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    accessedAt: timestamp('accessed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('journal_access_log_share_idx').on(table.shareId, table.accessedAt.desc()),
    pgPolicy('journal_access_log_select_participants', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.professionalId} = ${authUid} or exists (
        select 1 from public.journal_shares s
        where s.id = ${table.shareId} and s.patient_id = ${authUid}
      )`,
    }),
    pgPolicy('journal_access_log_insert_by_professional', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${table.professionalId} = ${authUid}
        and exists (
          select 1 from public.journal_shares s
          where s.id = ${table.shareId}
            and s.professional_id = ${authUid}
            and s.revoked_at is null
            and (s.expires_at is null or s.expires_at > now())
        )`,
    }),
  ],
).enableRLS()
