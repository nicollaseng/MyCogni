import {
  professionalDocumentBucket,
  professionalDocumentLimits,
  professionalDocumentTypes,
  type ProfessionalDocumentType,
} from '@mycogni/domain'
import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { authenticatedRole, authUid, authUsers } from 'drizzle-orm/supabase'

const allowedTypes = sql.raw(professionalDocumentTypes.map((type) => `'${type}'`).join(', '))

export const professionalDocuments = pgTable(
  'professional_documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    path: text('path').notNull().unique(),
    fileName: text('file_name').notNull(),
    contentType: text('content_type').$type<ProfessionalDocumentType>().notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('professional_documents_content_type', sql`${table.contentType} in (${allowedTypes})`),
    check(
      'professional_documents_size',
      sql`${table.sizeBytes} between 1 and ${sql.raw(String(professionalDocumentLimits.bytes))}`,
    ),
    check(
      'professional_documents_file_name_length',
      sql`char_length(${table.fileName}) between 1 and ${sql.raw(String(professionalDocumentLimits.fileName))}`,
    ),
    index('professional_documents_user_created_idx').on(table.userId, table.createdAt.desc()),
    pgPolicy('professional_documents_select_own', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy('professional_documents_select_admin', {
      for: 'select',
      to: authenticatedRole,
      using: sql`public.is_admin()`,
    }),
    pgPolicy('professional_documents_insert_own', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${authUid}
        and split_part(${table.path}, '/', 1) = ${authUid}::text
        and exists (
          select 1 from public.professional_profiles p
          where p.user_id = ${authUid} and p.status <> 'verified'
        )
        and exists (
          select 1 from storage.objects o
          where o.bucket_id = '${sql.raw(professionalDocumentBucket)}' and o.name = ${table.path}
        )`,
    }),
  ],
).enableRLS()
