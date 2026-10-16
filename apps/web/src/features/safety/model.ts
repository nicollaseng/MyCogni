import { z } from 'zod'

export const safetyPromptSchema = z.object({
  professionals: z.array(z.object({ name: z.string(), emergencyWhatsapp: z.string().nullable() })),
})

export type SafetyPrompt = z.infer<typeof safetyPromptSchema>
