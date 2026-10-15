import { locales } from '@mycogni/domain'
import { z } from 'zod'

export const moodReportPeriods = [7, 30] as const

export type MoodReportPeriod = (typeof moodReportPeriods)[number]

export const moodReportQuerySchema = z.object({
  days: z.coerce.number().pipe(z.literal(moodReportPeriods)),
  notes: z.stringbool().default(false),
  reading: z.stringbool().default(true),
  locale: z.enum(locales).optional(),
})

export type MoodReportQuery = z.infer<typeof moodReportQuerySchema>
