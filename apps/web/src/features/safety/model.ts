import { z } from 'zod'

export const safetyPromptSchema = z.object({ professionals: z.array(z.string()) })

export type SafetyPrompt = z.infer<typeof safetyPromptSchema>
