import { isTrackStep, trackIds } from '@mycogni/domain'
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
