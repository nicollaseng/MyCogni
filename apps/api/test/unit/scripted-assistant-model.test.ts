import { describe, expect, it } from '@jest/globals'
import { bannedPhrasesIn, validActions } from '@mycogni/domain'
import type { AssistantAnswer, AssistantRequest } from '../../src/ai/assistant-model.ts'
import {
  personalAssistantPrompt,
  professionalAssistantPrompt,
} from '../../src/ai/assistant-prompts.ts'
import { createScriptedAssistantModel } from '../../src/ai/scripted-assistant-model.ts'

const readTool = {
  name: 'read_patterns',
  description: 'patterns',
  input_schema: { type: 'object' as const },
}

function request(text: string, overrides: Partial<AssistantRequest> = {}): AssistantRequest {
  return {
    system: personalAssistantPrompt,
    history: [{ role: 'user', text }],
    notes: ['Locale: pt-BR.'],
    tools: [readTool],
    runTool: () => Promise.resolve('{"checkInsInLast90Days":3}'),
    ...overrides,
  }
}

function answered(answer: AssistantAnswer) {
  if (answer.kind !== 'answer') {
    throw new Error('expected an answer')
  }
  return answer
}

describe('createScriptedAssistantModel', () => {
  const model = createScriptedAssistantModel()

  it('answers from the records with one invitation and two catalog actions', async () => {
    const answer = answered(await model.answer(request('Como foi minha semana?')))

    expect(answer.text).toContain('aparecem 3 check-ins')
    expect(answer.text).toContain('O que acha de')
    expect(answer.text.match(/\?/g)).toHaveLength(1)
    expect(bannedPhrasesIn(answer.text)).toEqual([])
    expect(validActions(answer.actions, 'personal')).toEqual([
      { type: 'article', id: 'sleep-and-mood' },
      { type: 'check_in' },
    ])
  })

  it('offers breathing when it cannot read the records', async () => {
    const answer = answered(await model.answer(request('Oi', { tools: [] })))

    expect(answer.text).toContain('Não consigo ver os seus registros')
    expect(validActions(answer.actions, 'personal')).toEqual([{ type: 'breathe' }])
  })

  it('meets a loss with care and suggests writing a memory', async () => {
    const pt = answered(await model.answer(request('Minha avó morreu semana passada.')))
    const en = answered(
      await model.answer(
        request('My grandmother passed away last week.', { notes: ['Locale: en-US.'] }),
      ),
    )

    expect(pt.text).toContain('Sinto muito pela sua perda.')
    expect(en.text).toContain('I am so sorry for your loss.')
    for (const answer of [pt, en]) {
      expect(answer.risk).toBe('none')
      expect(answer.text.match(/\?/g)).toHaveLength(1)
      expect(validActions(answer.actions, 'personal')).toEqual([{ type: 'mybook' }])
    }
  })

  it('puts the safety of a friend first, without actions', async () => {
    const answer = answered(
      await model.answer(
        request('Meu amigo quer se matar', { notes: ['Locale: pt-BR.', 'Signs of distress'] }),
      ),
    )

    expect(answer.risk).toBe('urgent')
    expect(answer.actions).toEqual([])
  })

  it('stays clinical and gives no actions to professionals', async () => {
    const answer = answered(
      await model.answer(
        request('Meu paciente perdeu o pai, como está o humor?', {
          system: professionalAssistantPrompt,
        }),
      ),
    )

    expect(answer.text).toContain('Nos registros compartilhados')
    expect(answer.actions).toEqual([])
  })

  it('helps with an open page without actions', async () => {
    const answer = answered(
      await model.answer(
        request('Resuma esta página', {
          tools: [{ ...readTool, name: 'read_page' }],
          runTool: () => Promise.resolve('{"title":"Domingo no parque"}'),
        }),
      ),
    )

    expect(answer.text).toContain('Domingo no parque')
    expect(answer.actions).toEqual([])
  })
})
