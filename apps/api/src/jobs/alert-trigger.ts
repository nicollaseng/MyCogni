import { z } from 'zod'

export const savedNoteSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('check_in'), patientId: z.uuid(), checkInId: z.uuid() }),
  z.object({
    kind: z.literal('addendum'),
    patientId: z.uuid(),
    checkInId: z.uuid(),
    addendumId: z.uuid(),
  }),
  z.object({ kind: z.literal('journal'), patientId: z.uuid(), entryId: z.uuid() }),
])

export type SavedNote = z.infer<typeof savedNoteSchema>

export const alertTriggerSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('check-in'), patientId: z.uuid() }),
  z.object({ kind: z.literal('assessment'), patientId: z.uuid(), assessmentId: z.uuid() }),
  z.object({ kind: z.literal('summary'), insightId: z.uuid() }),
  z.object({ kind: z.literal('daily') }),
  z.object({ kind: z.literal('note'), note: savedNoteSchema }),
])

export type AlertTrigger = z.infer<typeof alertTriggerSchema>
