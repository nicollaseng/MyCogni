import { alertLevels, alertReasons, alertStatuses } from '@mycogni/domain'
import { z } from 'zod'

const timestamp = z.iso.datetime({ offset: true })

export const professionalAlertSchema = z.object({
  id: z.uuid(),
  patientId: z.uuid(),
  patientName: z.string().nullable(),
  patientPhotoUrl: z.string().nullable(),
  reason: z.enum(alertReasons),
  level: z.enum(alertLevels),
  status: z.enum(alertStatuses),
  createdAt: timestamp,
  acknowledgedAt: timestamp.nullable(),
  resolvedAt: timestamp.nullable(),
})

export type ProfessionalAlert = z.infer<typeof professionalAlertSchema>

export const professionalAlertListSchema = z.array(professionalAlertSchema)

export const alertQuerySchema = z.object({ patientId: z.uuid().optional() })

export type AlertQuery = z.infer<typeof alertQuerySchema>

export const alertCountSchema = z.object({
  pending: z.int().min(0),
  urgent: z.int().min(0),
})

export type AlertCount = z.infer<typeof alertCountSchema>
