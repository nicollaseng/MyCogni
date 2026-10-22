import type { PatientAssignment, QuestionnaireContent, QuestionnaireRun } from '@mycogni/contracts'

const professional = { name: 'Dra. Helena Prado', kind: 'psychologist' } as const

export const anxietyContent: QuestionnaireContent = {
  locale: 'pt-BR',
  lead: 'Durante as últimas 2 semanas, com que freqüência você foi incomodado/a pelos problemas abaixo?',
  stem: null,
  items: [
    'Sentir-se nervoso/a, ansioso/a ou muito tenso/a',
    'Não ser capaz de impedir ou de controlar as preocupações',
    'Preocupar-se muito com diversas coisas',
  ],
  standaloneItems: [],
  options: [
    { label: 'Nenhuma vez', value: 0 },
    { label: 'Vários dias', value: 1 },
    { label: 'Mais da metade dos dias', value: 2 },
    { label: 'Quase todos os dias', value: 3 },
  ],
  notice: null,
}

export function run(overrides: Partial<QuestionnaireRun>): QuestionnaireRun {
  return {
    id: '7b0f9c62-5d0e-4a4f-9b55-2a3b1c4d5e6f',
    area: 'anxiety',
    status: 'in_progress',
    itemCount: 3,
    minutes: 2,
    note: null,
    professional,
    content: anxietyContent,
    answers: [null, null, null],
    summary: null,
    ...overrides,
  }
}

export function openAssignment(overrides: Partial<PatientAssignment>): PatientAssignment {
  return {
    id: 'a1d9b5c4-3e2f-4a1b-8c7d-6e5f4a3b2c1d',
    area: 'depression',
    status: 'assigned',
    itemCount: 9,
    minutes: 3,
    answered: 0,
    note: null,
    availableFrom: '2026-10-20T12:00:00.000Z',
    professional,
    ...overrides,
  }
}
