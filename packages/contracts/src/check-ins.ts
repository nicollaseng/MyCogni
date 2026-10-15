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

export const checkInQuerySchema = z.object({
  since: z.iso.datetime({ offset: true }).optional(),
  before: z.iso.datetime({ offset: true }).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
})

export type CheckInQuery = z.infer<typeof checkInQuerySchema>
