import { describe, expect, it } from '@jest/globals'
import type { AssistantMode } from '@mycogni/domain'
import {
  createAssistantToolbox,
  type ToolSubject,
} from '../../src/modules/assistant/assistant-tools.ts'

const completedAt = new Date('2026-10-14T15:00:00Z')

const toolbox = createAssistantToolbox({
  checkIns: { list: () => Promise.resolve([]) },
  assessments: {
    list: () =>
      Promise.resolve([
        {
          id: 'a1',
          instrument: 'phq9',
          totalScore: 13,
          severity: 'moderate',
          hasRiskFlag: false,
          completedAt,
        },
        {
          id: 'a2',
          instrument: 'gad7',
          totalScore: 7,
          severity: 'mild',
          hasRiskFlag: false,
          completedAt,
        },
      ]),
  },
  insights: {
    listForPatient: () => Promise.resolve([]),
    listForProfessional: () => Promise.resolve([]),
  },
  journal: { list: () => Promise.resolve([]), recordAccess: () => Promise.resolve() },
  now: () => new Date('2026-10-20T15:00:00Z'),
})

function subject(mode: AssistantMode, locale: ToolSubject['locale'] = 'pt-BR'): ToolSubject {
  return {
    viewerId: 'viewer',
    ownerId: 'owner',
    mode,
    locale,
    timeZone: 'America/Sao_Paulo',
    records: true,
    journal: false,
  }
}

function questionnaires(mode: AssistantMode, locale?: ToolSubject['locale']) {
  return toolbox.runner(subject(mode, locale))({ name: 'read_questionnaires', input: {} })
}

describe('questionnaire tool', () => {
  it('gives the person plain words and levels, with no instrument names or scores', async () => {
    const result = await questionnaires('personal')

    expect(result).toContain('"topic":"ânimo","signs":"moderado"')
    expect(result).toContain('"topic":"ansiedade","signs":"leve"')
    expect(result).not.toMatch(/PHQ|GAD|score|13|"7"|:7/)
  })

  it('speaks English to the person in English', async () => {
    const result = await questionnaires('personal', 'en-US')

    expect(result).toContain('"topic":"mood","signs":"moderate"')
    expect(result).toContain('"topic":"anxiety","signs":"mild"')
  })

  it('keeps the instrument names and scores for the professional', async () => {
    const result = await questionnaires('professional')

    expect(result).toContain('"questionnaire":"PHQ-9"')
    expect(result).toContain('"score":13,"maxScore":27')
    expect(result).toContain('"questionnaire":"GAD-7"')
  })

  it('describes the questionnaires without instrument names to the person only', () => {
    const access = { records: true, journal: false }
    const personal = toolbox.definitions(access, 'personal')
    const professional = toolbox.definitions(access, 'professional')

    expect(JSON.stringify(personal)).not.toMatch(/PHQ|GAD|score/)
    expect(personal.map((tool) => tool.name)).toEqual(professional.map((tool) => tool.name))
    expect(JSON.stringify(professional)).toContain('PHQ-9 and GAD-7 results with score')
  })
})
