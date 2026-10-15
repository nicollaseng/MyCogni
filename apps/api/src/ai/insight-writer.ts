import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import {
  patientInsightContentSchema,
  professionalInsightContentSchema,
  type PatientInsightContent,
  type ProfessionalInsightContent,
} from '@mycogni/contracts'
import type { Locale } from '@mycogni/domain'
import { patientInsightSystemPrompt, professionalInsightSystemPrompt } from './insight-prompts.ts'

export interface InsightRecords {
  locale: Locale
  period: { start: string; end: string }
  checkIns: {
    day: string
    moodLevel: number
    emotions: string[]
    contexts: string[]
    note: string | null
  }[]
  screenings: { instrument: string; totalScore: number; severity: string; day: string }[]
  journal: { day: string; title: string | null; text: string }[]
}

export interface InsightWriter {
  readonly model: string
  forPatient(records: InsightRecords): Promise<PatientInsightContent | null>
  forProfessional(records: InsightRecords): Promise<ProfessionalInsightContent | null>
}

export const insightModel = 'claude-haiku-5-5'

export function createClaudeInsightWriter(apiKey: string): InsightWriter {
  const client = new Anthropic({ apiKey })

  function request(system: string, records: InsightRecords) {
    return {
      model: insightModel,
      max_tokens: 4000,
      system: [
        { type: 'text' as const, text: system, cache_control: { type: 'ephemeral' as const } },
      ],
      messages: [{ role: 'user' as const, content: JSON.stringify(records) }],
    }
  }

  return {
    model: insightModel,
    async forPatient(records) {
      const response = await client.messages.parse({
        ...request(patientInsightSystemPrompt, records),
        output_config: { effort: 'low', format: zodOutputFormat(patientInsightContentSchema) },
      })
      return response.stop_reason === 'refusal' ? null : response.parsed_output
    },
    async forProfessional(records) {
      const response = await client.messages.parse({
        ...request(professionalInsightSystemPrompt, records),
        output_config: {
          effort: 'low',
          format: zodOutputFormat(professionalInsightContentSchema),
        },
      })
      return response.stop_reason === 'refusal' ? null : response.parsed_output
    },
  }
}
