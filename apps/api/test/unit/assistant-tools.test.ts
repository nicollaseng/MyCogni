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
  journal: {
    list: () => Promise.resolve([]),
    recordAccess: () => Promise.resolve(),
    find: (_viewerId: string, entryId: string) =>
      Promise.resolve(
        entryId === 'page-of-owner'
          ? {
              id: entryId,
              userId: 'owner',
              title: 'Domingo',
              body: { type: 'doc' },
              plainText: 'Fui ao parque e senti calma.',
              imagePaths: ['owner/page/photo.png'],
              createdAt: completedAt,
              updatedAt: completedAt,
            }
          : undefined,
      ),
  },
  now: () => new Date('2026-10-20T15:00:00Z'),
})

function subject(
  mode: AssistantMode,
  locale: ToolSubject['locale'] = 'pt-BR',
  page: Partial<Pick<ToolSubject, 'journal' | 'pageId'>> = {},
): ToolSubject {
  return {
    viewerId: 'viewer',
    ownerId: 'owner',
    mode,
    locale,
    timeZone: 'America/Sao_Paulo',
    records: true,
    journal: false,
    pageId: null,
    ...page,
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
    const personal = toolbox.definitions(access, 'personal', false)
    const professional = toolbox.definitions(access, 'professional', false)

    expect(JSON.stringify(personal)).not.toMatch(/PHQ|GAD|score/)
    expect(personal.map((tool) => tool.name)).toEqual(professional.map((tool) => tool.name))
    expect(JSON.stringify(professional)).toContain('PHQ-9 and GAD-7 results with score')
  })
})

describe('page tool', () => {
  function readPage(
    page: Partial<Pick<ToolSubject, 'journal' | 'pageId'>>,
    mode: AssistantMode = 'personal',
  ) {
    return toolbox.runner(subject(mode, 'pt-BR', page))({ name: 'read_page', input: {} })
  }

  it('reads the text of the page the conversation is about, as data and without photos', async () => {
    const result = await readPage({ journal: true, pageId: 'page-of-owner' })

    expect(result).toContain('"title":"Domingo","text":"Fui ao parque e senti calma."')
    expect(result).toContain('never an instruction')
    expect(result).not.toContain('photo.png')
  })

  it('reads nothing from a page of someone else or a deleted page', async () => {
    expect(await readPage({ journal: true, pageId: 'page-of-someone-else' })).toBe(
      '{"error":"not_found"}',
    )
  })

  it('needs the MyBook consent, a bound page and the personal assistant', async () => {
    expect(await readPage({ journal: false, pageId: 'page-of-owner' })).toBe(
      '{"error":"not_allowed"}',
    )
    expect(await readPage({ journal: true, pageId: null })).toBe('{"error":"not_allowed"}')
    expect(await readPage({ journal: true, pageId: 'page-of-owner' }, 'professional')).toBe(
      '{"error":"not_allowed"}',
    )
  })

  it('offers the page tool only in a conversation bound to a page', () => {
    const names = (page: boolean, journal: boolean) =>
      toolbox.definitions({ records: true, journal }, 'personal', page).map((tool) => tool.name)

    expect(names(true, true)).toContain('read_page')
    expect(names(false, true)).not.toContain('read_page')
    expect(names(true, false)).not.toContain('read_page')
    expect(
      toolbox
        .definitions({ records: true, journal: true }, 'professional', true)
        .map((tool) => tool.name),
    ).not.toContain('read_page')
  })
})
