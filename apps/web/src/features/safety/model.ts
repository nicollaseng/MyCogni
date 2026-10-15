import { riskLevels } from '@mycogni/domain'
import { z } from 'zod'

export const safetyPromptSchema = z.object({
  level: z.enum(riskLevels).exclude(['none']),
  professionals: z.array(z.string()),
})

export type SafetyPrompt = z.infer<typeof safetyPromptSchema>
