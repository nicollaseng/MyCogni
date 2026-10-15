import { z } from 'zod'

export const alertTriggerSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('check-in'), patientId: z.uuid() }),
  z.object({ kind: z.literal('assessment'), patientId: z.uuid(), assessmentId: z.uuid() }),
  z.object({ kind: z.literal('summary'), insightId: z.uuid() }),
  z.object({ kind: z.literal('daily') }),
])

export type AlertTrigger = z.infer<typeof alertTriggerSchema>
