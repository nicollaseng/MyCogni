import { z } from 'zod'
import { assessmentSchema } from './assessments.ts'
import { checkInListSchema } from './check-ins.ts'
import { consentSchema } from './consents.ts'
import { profileSchema } from './profile.ts'

export const exportedAssessmentSchema = assessmentSchema.extend({
  answers: z.array(z.int()),
})

export const accountExportSchema = z.object({
  exportedAt: z.iso.datetime({ offset: true }),
  profile: profileSchema,
  consents: z.array(consentSchema),
  assessments: z.array(exportedAssessmentSchema),
  checkIns: checkInListSchema,
})

export type AccountExport = z.infer<typeof accountExportSchema>
