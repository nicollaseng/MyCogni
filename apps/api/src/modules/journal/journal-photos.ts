import type { JournalPhoto, JournalPhotoPage, JournalPhotoQuery } from '@mycogni/contracts'
import { captionOf } from '@mycogni/domain'
import { sql } from 'drizzle-orm'
import { z } from 'zod'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import type { Database } from '../../db/client.ts'
import { withUser } from '../../db/rls.ts'
import type { JournalImageStore } from '../../storage/journal-images.ts'

export interface JournalPhotoRecord {
  entryId: string
  entryTitle: string | null
  writtenAt: Date
  position: number
  attrs: Readonly<Record<string, unknown>>
  path: string
}

export interface JournalPhotoRepository {
  photos(userId: string, query: JournalPhotoQuery): Promise<JournalPhotoRecord[]>
}

export interface JournalPhotoService {
  page(user: AuthenticatedUser, query: JournalPhotoQuery): Promise<JournalPhotoPage>
}

const rowSchema = z.object({
  entryId: z.uuid(),
  entryTitle: z.string().nullable(),
  writtenAt: z.coerce.date(),
  position: z.coerce.number().int(),
  attrs: z.record(z.string(), z.unknown()).and(z.object({ path: z.string() })),
})

function pixelsOf(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null
}

export function createJournalPhotoRepository(db: Database): JournalPhotoRepository {
  return {
    photos(userId, { offset, limit }) {
      return withUser(db, userId, async (tx) => {
        const rows = await tx.execute(sql`
          select "entryId", "entryTitle", "writtenAt", "position", "attrs"
          from (
            select
              e.id as "entryId",
              e.title as "entryTitle",
              e.created_at as "writtenAt",
              photo.node -> 'attrs' as "attrs",
              row_number() over (partition by e.id order by photo.place)::int as "position"
            from public.journal_entries e
            cross join lateral jsonb_path_query(
              e.body,
              'strict $.**?(@.type == "image")'
            ) with ordinality as photo(node, place)
            where e.user_id = ${userId}
              and jsonb_typeof(photo.node -> 'attrs' -> 'path') = 'string'
          ) photos
          order by "writtenAt" desc, "entryId", "position"
          limit ${limit} offset ${offset}
        `)
        return z
          .array(rowSchema)
          .parse(rows)
          .map((row) => ({ ...row, path: row.attrs.path }))
      })
    },
  }
}

export function createJournalPhotoService(
  repository: JournalPhotoRepository,
  images: JournalImageStore,
): JournalPhotoService {
  return {
    async page(user, { offset, limit }) {
      const records = await repository.photos(user.id, { offset, limit: limit + 1 })
      const shown = records.slice(0, limit)
      const urls = await images.sign(shown.map((record) => record.path))
      const photos = shown.map((record): JournalPhoto => ({
        entryId: record.entryId,
        entryTitle: record.entryTitle,
        writtenAt: record.writtenAt.toISOString(),
        position: record.position,
        path: record.path,
        url: urls[record.path] ?? null,
        caption: captionOf(record.attrs),
        width: pixelsOf(record.attrs.width),
        height: pixelsOf(record.attrs.height),
      }))
      return { photos, nextOffset: records.length > limit ? offset + limit : null }
    },
  }
}
