import { riskLevels } from '@mycogni/domain'
import { z } from 'zod'

export const riskLevelSchema = z.enum(riskLevels)

export const supportSignalSchema = z.object({ level: riskLevelSchema })

export type SupportSignal = z.infer<typeof supportSignalSchema>
