import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { memoryOperationsSchema } from '@mycogni/contracts'
import type { Locale, MemoryKind, MemoryOperation, MemorySourceKind } from '@mycogni/domain'
import { memoryRequest, memorySystemPrompt } from './memory-prompts.ts'

export interface ExtractionItem {
  id: string
  source: MemorySourceKind
  day: string
  text: string
}

export interface ExtractionMemory {
  id: string
  content: string
  kind: MemoryKind
  editable: boolean
}

export interface ExtractionInput {
  locale: Locale
  memories: readonly ExtractionMemory[]
  items: readonly ExtractionItem[]
}

export interface MemoryExtractor {
  readonly model: string
  extract(input: ExtractionInput): Promise<MemoryOperation[] | null>
}

export const memoryModel = 'claude-haiku-5-5'

export function createClaudeMemoryExtractor(apiKey: string): MemoryExtractor {
  const client = new Anthropic({ apiKey, maxRetries: 2, timeout: 60_000 })

  return {
    model: memoryModel,
    async extract(input) {
      const response = await client.messages.parse({
        model: memoryModel,
        max_tokens: 4000,
        system: [{ type: 'text', text: memorySystemPrompt, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: memoryRequest(input) }],
        output_config: { effort: 'low', format: zodOutputFormat(memoryOperationsSchema) },
      })
      if (response.stop_reason === 'refusal' || response.parsed_output === null) {
        return null
      }
      return response.parsed_output.operations
    },
  }
}
