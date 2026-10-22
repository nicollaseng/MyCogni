import { describe, expect, it } from '@jest/globals'
import type Anthropic from '@anthropic-ai/sdk'
import {
  AssistantModelError,
  assistantModelId,
  createClaudeAssistantModel,
  type AssistantRequest,
  type SendMessage,
} from '../../src/ai/assistant-model.ts'

function message(
  stopReason: Anthropic.StopReason,
  content: Anthropic.ContentBlock[],
): Anthropic.Message {
  return {
    id: 'msg_test',
    type: 'message',
    role: 'assistant',
    model: assistantModelId,
    container: null,
    diagnostics: null,
    stop_details: null,
    stop_reason: stopReason,
    stop_sequence: null,
    content,
    usage: {
      cache_creation: null,
      cache_creation_input_tokens: null,
      cache_read_input_tokens: null,
      inference_geo: null,
      input_tokens: 1,
      output_tokens: 1,
      output_tokens_details: null,
      server_tool_use: null,
      service_tier: null,
    },
  }
}

function text(value: string): Anthropic.TextBlock {
  return { type: 'text', text: value, citations: null }
}

function toolUse(id: string, name: string, input: unknown): Anthropic.ToolUseBlock {
  return { type: 'tool_use', id, name, input, caller: { type: 'direct' } }
}

function scripted(responses: Anthropic.Message[]) {
  const sent: Anthropic.MessageCreateParamsNonStreaming[] = []
  const send: SendMessage = (params) => {
    sent.push(params)
    const next = responses.shift()
    return next === undefined
      ? Promise.reject(new Error('no more responses'))
      : Promise.resolve(next)
  }
  return { send, sent }
}

function request(overrides: Partial<AssistantRequest> = {}): AssistantRequest {
  return {
    system: 'system prompt',
    history: [
      { role: 'assistant', text: 'olá' },
      { role: 'user', text: 'Como estou?' },
    ],
    notes: ['Locale: pt-BR.'],
    tools: [],
    runTool: () => Promise.resolve('<records>[]</records>'),
    ...overrides,
  }
}

const answer = JSON.stringify({
  reply: 'Você está bem.',
  risk: 'watch',
  actions: [{ type: 'breathe', id: null }],
})

describe('createClaudeAssistantModel', () => {
  it('sends the cached system prompt, the turns and the notes, and reads the JSON answer', async () => {
    const { send, sent } = scripted([message('end_turn', [text(answer)])])

    const result = await createClaudeAssistantModel(send).answer(request())

    expect(result).toEqual({
      kind: 'answer',
      text: 'Você está bem.',
      risk: 'watch',
      actions: [{ type: 'breathe', id: null }],
    })
    expect(sent[0]?.model).toBe('claude-haiku-5-5')
    expect(sent[0]?.system).toEqual([
      { type: 'text', text: 'system prompt', cache_control: { type: 'ephemeral' } },
    ])
    expect(sent[0]?.messages).toEqual([
      { role: 'user', content: 'Como estou?' },
      { role: 'system', content: 'Locale: pt-BR.' },
    ])
    expect(sent[0]).not.toHaveProperty('temperature')
    expect(sent[0]).not.toHaveProperty('fallbacks')
  })

  it('runs the tools it is asked for and sends the results back unchanged', async () => {
    const calls: unknown[] = []
    const first = message('tool_use', [toolUse('t1', 'read_patterns', { days: 3 })])
    const { send, sent } = scripted([first, message('end_turn', [text(answer)])])

    await createClaudeAssistantModel(send).answer(
      request({
        notes: [],
        runTool: (call) => {
          calls.push(call)
          return Promise.resolve('dados')
        },
      }),
    )

    expect(calls).toEqual([{ name: 'read_patterns', input: { days: 3 } }])
    expect(sent[1]?.messages.slice(1)).toEqual([
      { role: 'assistant', content: first.content },
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't1', content: 'dados' }] },
    ])
  })

  it('stops running tools after the round limit and asks for an answer', async () => {
    const loop = Array.from({ length: 6 }, (_, index) =>
      message('tool_use', [toolUse(`t${String(index)}`, 'read_check_ins', {})]),
    )
    let runs = 0
    const { send } = scripted(loop)

    await expect(
      createClaudeAssistantModel(send).answer(
        request({
          runTool: () => {
            runs += 1
            return Promise.resolve('x')
          },
        }),
      ),
    ).rejects.toThrow(AssistantModelError)
    expect(runs).toBe(4)
  })

  it('returns a refusal before reading any content', async () => {
    const { send } = scripted([message('refusal', [text('{"reply":"partial')])])

    expect(await createClaudeAssistantModel(send).answer(request())).toEqual({ kind: 'refusal' })
  })

  it('treats cut, malformed or empty answers as failures', async () => {
    for (const response of [
      message('max_tokens', [text('{"reply":')]),
      message('end_turn', [text('not json')]),
      message('end_turn', [text('{"reply":"  ","risk":"none","actions":[]}')]),
      message('end_turn', [text('{"reply":"ok","risk":"high","actions":[]}')]),
      message('end_turn', [
        text('{"reply":"ok","risk":"none","actions":[{"type":"link","id":null}]}'),
      ]),
    ]) {
      const { send } = scripted([response])
      await expect(createClaudeAssistantModel(send).answer(request())).rejects.toThrow(
        AssistantModelError,
      )
    }
  })
})
