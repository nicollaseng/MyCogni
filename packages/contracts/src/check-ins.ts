import { checkInLimits, maxMoodLevel } from '@mycogni/domain'
import { z } from 'zod'

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

export const checkInListSchema = z.array(checkInSchema)

export const checkInSearchLength = 100

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
  tags: tagListSchema.optional(),
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

export const checkInCountSchema = z.object({ count: z.int().min(0) })

export type CheckInCount = z.infer<typeof checkInCountSchema>
