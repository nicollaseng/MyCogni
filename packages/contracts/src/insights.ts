import { insightAttentionLevels } from '@mycogni/domain'
import { z } from 'zod'

const timestamp = z.iso.datetime({ offset: true })

export const patientInsightContentSchema = z.object({
  summary: z.string().describe('Two to four warm, plain sentences about how the period went.'),
  highlights: z
    .array(z.string())
    .describe('Up to four short observations grounded in the records, each one sentence.'),
  suggestions: z
    .array(
      z.object({
        title: z.string().describe('A small, concrete action, in a few words.'),
        detail: z.string().describe('One or two sentences on why and how, tied to the records.'),
      }),
    )
    .describe('Up to three gentle, practical suggestions for the coming days.'),
})

export type PatientInsightContent = z.infer<typeof patientInsightContentSchema>

export const professionalInsightContentSchema = z.object({
  summary: z.string().describe('Three to five concise clinical-style sentences on the period.'),
  trends: z
    .array(z.string())
    .describe('Up to five observations on mood level, variability and questionnaire scores.'),
  themes: z
    .array(z.string())
    .describe('Up to five recurring themes from emotions, contexts and notes.'),
  attention: z
    .enum(insightAttentionLevels)
    .describe('urgent only for explicit self-harm or suicide content; watch for worsening signs.'),
  attentionReason: z
    .string()
    .nullable()
    .describe('One sentence explaining the attention level, or null when it is none.'),
})

export type ProfessionalInsightContent = z.infer<typeof professionalInsightContentSchema>

const insightBase = {
  id: z.uuid(),
  periodStart: timestamp,
  periodEnd: timestamp,
  checkInCount: z.int().min(0),
  createdAt: timestamp,
}

export const patientInsightSchema = z.object({
  ...insightBase,
  content: patientInsightContentSchema,
})

export type PatientInsight = z.infer<typeof patientInsightSchema>

export const patientInsightListSchema = z.array(patientInsightSchema)

export const professionalInsightSchema = z.object({
  ...insightBase,
  content: professionalInsightContentSchema,
})

export type ProfessionalInsight = z.infer<typeof professionalInsightSchema>

export const professionalInsightListSchema = z.array(professionalInsightSchema)
