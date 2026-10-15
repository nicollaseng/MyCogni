import { instrumentIds, severities } from '@mycogni/domain'
import { z } from 'zod'
import { professionalSummarySchema } from './invitations.ts'

const timestamp = z.iso.datetime({ offset: true })

export const careLinkSchema = z.object({
  id: z.uuid(),
  professional: professionalSummarySchema,
  sharesHistory: z.boolean(),
  startedAt: timestamp,
})

export type CareLink = z.infer<typeof careLinkSchema>

export const careLinkListSchema = z.array(careLinkSchema)

export const screeningSummarySchema = z.object({
  instrument: z.enum(instrumentIds),
  totalScore: z.int(),
  severity: z.enum(severities),
  hasRiskFlag: z.boolean(),
  completedAt: timestamp,
})

export type ScreeningSummary = z.infer<typeof screeningSummarySchema>

export const patientSummarySchema = z.object({
  id: z.uuid(),
  linkId: z.uuid(),
  name: z.string().nullable(),
  startedAt: timestamp,
  sharesHistory: z.boolean(),
  lastCheckIn: z.object({ moodLevel: z.int(), recordedAt: timestamp }).nullable(),
  checkInsLastWeek: z.int().min(0),
  screenings: z.array(screeningSummarySchema),
})

export type PatientSummary = z.infer<typeof patientSummarySchema>

export const patientSummaryListSchema = z.array(patientSummarySchema)
