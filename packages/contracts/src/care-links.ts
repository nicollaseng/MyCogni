import { attentionReasons, instrumentIds, severities } from '@mycogni/domain'
import { z } from 'zod'
import { linkedProfessionalSchema } from './invitations.ts'

const timestamp = z.iso.datetime({ offset: true })

export const careLinkSchema = z.object({
  id: z.uuid(),
  professional: linkedProfessionalSchema,
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
  photoUrl: z.url().nullable(),
  startedAt: timestamp,
  sharesHistory: z.boolean(),
  lastCheckIn: z.object({ moodLevel: z.int(), recordedAt: timestamp }).nullable(),
  checkInsLastWeek: z.int().min(0),
  checkInsLast30Days: z.int().min(0),
  moodAverage: z.number().nullable(),
  previousMoodAverage: z.number().nullable(),
  screenings: z.array(screeningSummarySchema),
  attention: z.array(z.enum(attentionReasons)),
})

export type PatientSummary = z.infer<typeof patientSummarySchema>

export const patientSummaryListSchema = z.array(patientSummarySchema)

export const activityDaySchema = z.object({
  day: z.iso.date(),
  checkIns: z.int().min(0),
  patients: z.int().min(0),
  moodAverage: z.number().nullable(),
})

export type ActivityDay = z.infer<typeof activityDaySchema>

export const recentCheckInSchema = z.object({
  patientId: z.uuid(),
  name: z.string().nullable(),
  moodLevel: z.int(),
  emotions: z.array(z.string()),
  contexts: z.array(z.string()),
  recordedAt: timestamp,
})

export type RecentCheckIn = z.infer<typeof recentCheckInSchema>

export const professionalOverviewSchema = z.object({
  activity: z.array(activityDaySchema),
  recent: z.array(recentCheckInSchema),
  invitations: z.object({ pending: z.int().min(0), expiringSoon: z.int().min(0) }),
})

export type ProfessionalOverview = z.infer<typeof professionalOverviewSchema>
