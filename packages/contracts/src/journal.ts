import { isCaptionText, journalImageNode, journalLimits } from '@mycogni/domain'
import { z } from 'zod'
import { pageQueryFields, pageSchemaOf } from './pagination.ts'
import { professionalKindSchema } from './professionals.ts'
import { supportSignalSchema } from './safety.ts'

const timestamp = z.iso.datetime({ offset: true })

const attributesSchema = z.record(z.string().max(40), z.unknown())

export interface JournalNode {
  type: string
  attrs?: Record<string, unknown>
  content?: JournalNode[]
  marks?: { type: string; attrs?: Record<string, unknown> }[]
  text?: string
}

function hasValidCaption(node: JournalNode): boolean {
  const caption = node.attrs?.caption
  return node.type !== journalImageNode || caption === undefined || isCaptionText(caption)
}

export const journalNodeSchema: z.ZodType<JournalNode> = z.lazy(() =>
  z
    .object({
      type: z.string().min(1).max(40),
      attrs: attributesSchema.optional(),
      content: z.array(journalNodeSchema).max(5000).optional(),
      marks: z
        .array(z.object({ type: z.string().min(1).max(40), attrs: attributesSchema.optional() }))
        .max(20)
        .optional(),
      text: z.string().max(journalLimits.plainText).optional(),
    })
    .refine(hasValidCaption, {
      message: `A photo caption is plain text of at most ${String(journalLimits.caption)} characters`,
      path: ['attrs', 'caption'],
    }),
)

export const journalDocumentSchema = journalNodeSchema.refine((node) => node.type === 'doc', {
  message: 'The body must be a document',
})

export const journalEntrySummarySchema = z.object({
  id: z.uuid(),
  title: z.string().nullable(),
  excerpt: z.string(),
  imageCount: z.int().min(0),
  createdAt: timestamp,
  updatedAt: timestamp,
})

export type JournalEntrySummary = z.infer<typeof journalEntrySummarySchema>

export const journalEntryPageSchema = pageSchemaOf(journalEntrySummarySchema)

export type JournalEntryPage = z.infer<typeof journalEntryPageSchema>

export const journalEntrySchema = z.object({
  id: z.uuid(),
  title: z.string().nullable(),
  body: journalDocumentSchema,
  plainText: z.string(),
  imagePaths: z.array(z.string()),
  imageUrls: z.record(z.string(), z.url()),
  createdAt: timestamp,
  updatedAt: timestamp,
})

export type JournalEntry = z.infer<typeof journalEntrySchema>

export const savedJournalEntrySchema = journalEntrySchema.extend({ support: supportSignalSchema })

export type SavedJournalEntry = z.infer<typeof savedJournalEntrySchema>

export const updateJournalEntrySchema = z.object({
  title: z.string().trim().max(journalLimits.title).nullable(),
  body: journalDocumentSchema,
  plainText: z.string().max(journalLimits.plainText),
  imagePaths: z.array(z.string().max(200)).max(journalLimits.imagesPerEntry),
})

export type UpdateJournalEntryInput = z.infer<typeof updateJournalEntrySchema>

export const journalQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  ...pageQueryFields,
})

export type JournalQuery = z.infer<typeof journalQuerySchema>

export const journalPhotoQuerySchema = z.object({
  offset: z.coerce.number().int().min(0).max(100_000).default(0),
  limit: z.coerce.number().int().min(1).max(60).default(30),
})

export type JournalPhotoQuery = z.infer<typeof journalPhotoQuerySchema>

export const journalPhotoSchema = z.object({
  entryId: z.uuid(),
  entryTitle: z.string().nullable(),
  writtenAt: timestamp,
  position: z.int().min(1),
  path: z.string(),
  url: z.url().nullable(),
  caption: z.string(),
  width: z.int().nullable(),
  height: z.int().nullable(),
})

export type JournalPhoto = z.infer<typeof journalPhotoSchema>

export const journalPhotoPageSchema = z.object({
  photos: z.array(journalPhotoSchema),
  nextOffset: z.int().nullable(),
})

export type JournalPhotoPage = z.infer<typeof journalPhotoPageSchema>

const shareBase = {
  careLinkId: z.uuid(),
  expiresAt: timestamp.nullable(),
}

export const createJournalShareSchema = z.discriminatedUnion('scope', [
  z.object({ ...shareBase, scope: z.literal('all') }),
  z.object({
    ...shareBase,
    scope: z.literal('entries'),
    entryIds: z.array(z.uuid()).min(1).max(200),
  }),
])

export type CreateJournalShareInput = z.infer<typeof createJournalShareSchema>

export const journalShareSchema = z.object({
  id: z.uuid(),
  careLinkId: z.uuid(),
  professional: z.object({ name: z.string(), kind: professionalKindSchema }),
  scope: z.enum(['all', 'entries']),
  entryIds: z.array(z.uuid()),
  expiresAt: timestamp.nullable(),
  revokedAt: timestamp.nullable(),
  active: z.boolean(),
  createdAt: timestamp,
  lastAccessAt: timestamp.nullable(),
})

export type JournalShare = z.infer<typeof journalShareSchema>

export const journalShareListSchema = z.array(journalShareSchema)

export const journalAccessSchema = z.object({
  entryId: z.uuid(),
  entryTitle: z.string().nullable(),
  accessedAt: timestamp,
})

export type JournalAccess = z.infer<typeof journalAccessSchema>

export const journalAccessListSchema = z.array(journalAccessSchema)
