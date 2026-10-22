import {
  isPracticeContent,
  isRecordable,
  maxMoodLevel,
  practiceKinds,
  practiceMaximumSeconds,
  trackIds,
  isTrackStep,
} from '@mycogni/domain'
import { z } from 'zod'

export const trackIdSchema = z.enum(trackIds)

export const zenStepParamsSchema = z
  .object({
    trackId: trackIdSchema,
    stepId: z.string().min(1).max(60),
  })
  .refine(({ trackId, stepId }) => isTrackStep(trackId, stepId), {
    message: 'This step is not part of the track',
    path: ['stepId'],
  })

export type ZenStepParams = z.infer<typeof zenStepParamsSchema>

export const stepProgressSchema = z.object({
  trackId: trackIdSchema,
  stepId: z.string(),
  completedAt: z.iso.datetime({ offset: true }),
})

export type StepProgress = z.infer<typeof stepProgressSchema>

export const stepProgressListSchema = z.array(stepProgressSchema)

const timestamp = z.iso.datetime({ offset: true })

const feelingSchema = z.int().min(0).max(maxMoodLevel)

export const practiceKindSchema = z.enum(practiceKinds)

export const recordZenSessionSchema = z
  .object({
    kind: practiceKindSchema,
    contentId: z.string().min(1).max(60),
    startedAt: timestamp,
    seconds: z.int().min(0).max(practiceMaximumSeconds),
    completed: z.boolean(),
    feelingAfter: feelingSchema.nullable().default(null),
  })
  .refine(({ kind, contentId }) => isPracticeContent(kind, contentId), {
    message: 'This content is not part of the practice',
    path: ['contentId'],
  })
  .refine((session) => isRecordable(session), {
    message: 'This session is too short to keep',
    path: ['seconds'],
  })

export type RecordZenSessionInput = z.infer<typeof recordZenSessionSchema>

export const zenSessionSchema = z.object({
  id: z.uuid(),
  kind: practiceKindSchema,
  contentId: z.string(),
  startedAt: timestamp,
  seconds: z.int(),
  completed: z.boolean(),
  feelingAfter: feelingSchema.nullable(),
})

export type ZenSession = z.infer<typeof zenSessionSchema>

export const zenSessionListSchema = z.array(zenSessionSchema)

export const zenSessionQuerySchema = z.object({ since: timestamp })

export const zenSessionFeelingSchema = z.object({ feelingAfter: feelingSchema })

export type ZenSessionFeeling = z.infer<typeof zenSessionFeelingSchema>

const hidden = z.int().min(0).nullable()

export const zenContentStatsSchema = z.object({
  kind: z.union([practiceKindSchema, z.literal('track')]),
  contentId: z.string(),
  people: hidden,
  starts: hidden,
  completions: hidden,
  medianSeconds: hidden,
  comparedPeople: hidden,
  better: hidden,
  same: hidden,
  worse: hidden,
})

export type ZenContentStats = z.infer<typeof zenContentStatsSchema>

export const zenStatsSchema = z.object({
  minimumPeople: z.int(),
  items: z.array(zenContentStatsSchema),
})

export type ZenStats = z.infer<typeof zenStatsSchema>
