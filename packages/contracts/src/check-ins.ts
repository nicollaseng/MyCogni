import { checkInLimits, checkInSearchLength, maxMoodLevel } from '@mycogni/domain'
import { z } from 'zod'
import { pageQueryFields, pageSchemaOf } from './pagination.ts'
import { supportSignalSchema } from './safety.ts'

const tagsSchema = z
  .array(z.string().trim().min(1).max(checkInLimits.tagLength))
  .max(checkInLimits.tags)

export const createCheckInSchema = z.object({
  moodLevel: z.int().min(0).max(maxMoodLevel),
  emotions: tagsSchema,
  contexts: tagsSchema,
  note: z.string().trim().max(checkInLimits.note).nullable(),
})

export type CreateCheckInInput = z.infer<typeof createCheckInSchema>

export const checkInSchema = z.object({
  id: z.uuid(),
  moodLevel: z.int().min(0).max(maxMoodLevel),
  emotions: z.array(z.string()),
  contexts: z.array(z.string()),
  note: z.string().nullable(),
  recordedAt: z.iso.datetime({ offset: true }),
})

export type CheckIn = z.infer<typeof checkInSchema>

export const recordedCheckInSchema = checkInSchema.extend({ support: supportSignalSchema })

export type RecordedCheckIn = z.infer<typeof recordedCheckInSchema>

export const checkInListSchema = z.array(checkInSchema)

export { checkInSearchLength }

const tagListSchema = z
  .string()
  .transform((value) => [
    ...new Set(
      value
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag !== ''),
    ),
  ])
  .pipe(z.array(z.string().max(checkInLimits.tagLength)).max(checkInLimits.tags))

const moodBoundSchema = z.coerce.number().int().min(0).max(maxMoodLevel)

const sinceSchema = z.iso.datetime({ offset: true }).optional()

const filterFields = {
  q: z.string().trim().max(checkInSearchLength).optional(),
  qTags: tagListSchema.optional(),
  emotions: tagListSchema.optional(),
  contexts: tagListSchema.optional(),
  minMood: moodBoundSchema.optional(),
  maxMood: moodBoundSchema.optional(),
  hasNote: z.stringbool().optional(),
}

export const checkInQuerySchema = z.object({
  since: sinceSchema,
  before: z.iso.datetime({ offset: true }).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
})

export type CheckInQuery = z.infer<typeof checkInQuerySchema>

export const checkInFilterSchema = z.object({ since: sinceSchema, ...filterFields })

export type CheckInFilter = z.infer<typeof checkInFilterSchema>

export const checkInSearchSchema = checkInQuerySchema.extend(filterFields)

export type CheckInSearch = z.infer<typeof checkInSearchSchema>

export const checkInPageQuerySchema = checkInFilterSchema.extend(pageQueryFields)

export type CheckInPageQuery = z.infer<typeof checkInPageQuerySchema>

export const checkInPageSchema = pageSchemaOf(checkInSchema)

export type CheckInPage = z.infer<typeof checkInPageSchema>

export const checkInCountSchema = z.object({ count: z.int().min(0) })

export type CheckInCount = z.infer<typeof checkInCountSchema>

export const createCheckInAddendumSchema = z.object({
  text: z.string().trim().min(1).max(checkInLimits.addendum),
})

export type CreateCheckInAddendumInput = z.infer<typeof createCheckInAddendumSchema>

export const checkInAddendumSchema = z.object({
  id: z.uuid(),
  text: z.string(),
  createdAt: z.iso.datetime({ offset: true }),
})

export type CheckInAddendum = z.infer<typeof checkInAddendumSchema>

export const recordedAddendumSchema = checkInAddendumSchema.extend({ support: supportSignalSchema })

export type RecordedAddendum = z.infer<typeof recordedAddendumSchema>

export const checkInDetailSchema = checkInSchema.extend({
  addenda: z.array(checkInAddendumSchema),
})

export type CheckInDetail = z.infer<typeof checkInDetailSchema>
