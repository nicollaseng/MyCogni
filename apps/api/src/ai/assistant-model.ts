import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import {
  assistantActionTypes,
  assistantLimits,
  riskLevels,
  type ProposedAction,
  type RiskLevel,
} from '@mycogni/domain'
import { z } from 'zod'

export interface AssistantToolDefinition {
  name: string
  description: string
  input_schema: Anthropic.Tool.InputSchema
}

export interface ToolCall {
  name: string
  input: unknown
}

export type ToolRunner = (call: ToolCall) => Promise<string>

export interface AssistantTurn {
  role: 'user' | 'assistant'
  text: string
}

export interface AssistantRequest {
  system: string
  history: readonly AssistantTurn[]
  notes: readonly string[]
  tools: readonly AssistantToolDefinition[]
  runTool: ToolRunner
}

export type AssistantAnswer =
  | { kind: 'answer'; text: string; risk: RiskLevel; actions: readonly ProposedAction[] }
  | { kind: 'refusal' }

export interface AssistantModel {
  readonly model: string
  answer(request: AssistantRequest): Promise<AssistantAnswer>
}

export class AssistantModelError extends Error {
  constructor(reason: string) {
    super(`The assistant model gave no usable answer: ${reason}`)
    this.name = 'AssistantModelError'
  }
}

export const assistantModelId = 'claude-haiku-5-5'

export const assistantReplySchema = z.object({
  reply: z.string(),
  risk: z.enum(riskLevels),
  actions: z.array(
    z.object({
      type: z.enum(assistantActionTypes),
      id: z.string().nullable(),
    }),
  ),
})

const roundLimitNote = 'Tool limit reached for this message. Answer now with what you already have.'

function toolUsesOf(content: readonly Anthropic.ContentBlock[]): Anthropic.ToolUseBlock[] {
  return content.filter((block): block is Anthropic.ToolUseBlock => block.type === 'tool_use')
}

function textOf(content: readonly Anthropic.ContentBlock[]): string {
  return content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')
}

function parseReply(text: string): AssistantAnswer {
  let payload: unknown
  try {
    payload = JSON.parse(text)
  } catch {
    throw new AssistantModelError('not json')
  }
  const parsed = assistantReplySchema.safeParse(payload)
  if (!parsed.success || parsed.data.reply.trim() === '') {
    throw new AssistantModelError('unexpected shape')
  }
  return {
    kind: 'answer',
    text: parsed.data.reply,
    risk: parsed.data.risk,
    actions: parsed.data.actions,
  }
}

function opening({ history, notes }: AssistantRequest): Anthropic.MessageParam[] {
  const firstUser = history.findIndex((turn) => turn.role === 'user')
  const turns = history
    .slice(Math.max(firstUser, 0))
    .map((turn): Anthropic.MessageParam => ({ role: turn.role, content: turn.text }))
  return notes.length === 0 ? turns : [...turns, { role: 'system', content: notes.join('\n\n') }]
}

export type SendMessage = (
  params: Anthropic.MessageCreateParamsNonStreaming,
) => Promise<Anthropic.Message>

export function anthropicSender(apiKey: string): SendMessage {
  const client = new Anthropic({ apiKey, maxRetries: 2, timeout: 60_000 })
  return (params) => client.messages.create(params)
}

export function createClaudeAssistantModel(send: SendMessage): AssistantModel {
  const format = zodOutputFormat(assistantReplySchema)

  return {
    model: assistantModelId,
    async answer(request) {
      const messages = opening(request)
      for (let round = 0; round <= assistantLimits.toolRounds + 1; round += 1) {
        const response = await send({
          model: assistantModelId,
          max_tokens: 4000,
          system: [{ type: 'text', text: request.system, cache_control: { type: 'ephemeral' } }],
          tools: [...request.tools],
          messages: [...messages],
          output_config: { effort: 'medium', format },
        })
        if (response.stop_reason === 'refusal') {
          return { kind: 'refusal' }
        }
        const calls = toolUsesOf(response.content)
        if (response.stop_reason !== 'tool_use' || calls.length === 0) {
          if (response.stop_reason === 'max_tokens') {
            throw new AssistantModelError('max tokens')
          }
          return parseReply(textOf(response.content))
        }
        messages.push({ role: 'assistant', content: response.content })
        const lastRound = round >= assistantLimits.toolRounds
        const results = await Promise.all(
          calls.map(async (call): Promise<Anthropic.ToolResultBlockParam> => ({
            type: 'tool_result',
            tool_use_id: call.id,
            content: lastRound
              ? roundLimitNote
              : await request.runTool({ name: call.name, input: call.input }),
          })),
        )
        messages.push({ role: 'user', content: results })
      }
      throw new AssistantModelError('too many tool rounds')
    },
  }
}
