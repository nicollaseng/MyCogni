import { z } from 'zod'
import { assessmentSchema } from './assessments.ts'
import { checkInListSchema } from './check-ins.ts'
import { consentSchema } from './consents.ts'
import { memorySchema } from './memories.ts'
import { profileSchema } from './profile.ts'
import { exportedReminderSchema } from './reminders.ts'

export const exportedAssessmentSchema = assessmentSchema.extend({
  answers: z.array(z.int()),
})

export const exportedConsentSchema = consentSchema.extend({
  revokedAt: z.iso.datetime({ offset: true }).nullable(),
})

export const accountExportSchema = z.object({
  exportedAt: z.iso.datetime({ offset: true }),
  profile: profileSchema,
  consents: z.array(exportedConsentSchema),
  assessments: z.array(exportedAssessmentSchema),
  checkIns: checkInListSchema,
  memories: z.array(memorySchema),
  reminders: exportedReminderSchema,
})

export type AccountExport = z.infer<typeof accountExportSchema>
