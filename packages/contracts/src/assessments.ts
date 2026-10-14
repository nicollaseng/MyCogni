import { instrumentIds, instruments, severities } from '@mycogni/domain'
import { z } from 'zod'

export const instrumentIdSchema = z.enum(instrumentIds)

export const submitAssessmentSchema = z
  .object({
    instrument: instrumentIdSchema,
    answers: z.array(z.int().min(0).max(3)),
  })
  .refine(({ instrument, answers }) => answers.length === instruments[instrument].items.length, {
    message: 'Answer every item of the form',
    path: ['answers'],
  })

export type SubmitAssessmentInput = z.infer<typeof submitAssessmentSchema>

export const assessmentSchema = z.object({
  id: z.uuid(),
  instrument: instrumentIdSchema,
  totalScore: z.int(),
  maxScore: z.int(),
  severity: z.enum(severities),
  hasRiskFlag: z.boolean(),
  completedAt: z.iso.datetime({ offset: true }),
})

export type Assessment = z.infer<typeof assessmentSchema>

export const assessmentListSchema = z.array(assessmentSchema)
