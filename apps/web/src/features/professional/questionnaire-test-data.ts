import type {
  AssignmentDetail,
  ProfessionalAssignment,
  QuestionnaireCatalog,
} from '@mycogni/contracts'
import {
  catalogOfArea,
  questionnaireAreas,
  questionnaireForms,
  satepsiCheckedOn,
  scoreQuestionnaire,
  unavailableReasonOf,
  type Locale,
  type ProfessionalKind,
  type QuestionnaireVariant,
} from '@mycogni/domain'

export const patientId = '5c3d2e1f-0a9b-4c8d-8e7f-6a5b4c3d2e1f'

export function assignment(overrides: Partial<ProfessionalAssignment>): ProfessionalAssignment {
  return {
    id: '9e8d7c6b-5a49-4382-9170-6f5e4d3c2b1a',
    patientId,
    variant: 'phq9',
    instrument: 'phq',
    status: 'assigned',
    note: null,
    repeatEveryDays: null,
    availableFrom: '2026-10-20T12:00:00.000Z',
    createdAt: '2026-10-20T12:00:00.000Z',
    completedAt: null,
    cancelledAt: null,
    result: null,
    ...overrides,
  }
}

export function catalogFor(kind: ProfessionalKind, patientLocale: Locale): QuestionnaireCatalog {
  return {
    patientLocale,
    complementarySource: kind === 'psychologist',
    areas: questionnaireAreas.map((area) => ({
      area,
      options: catalogOfArea(area).map((entry) => ({
        variant: entry.variant,
        instrument: entry.instrument,
        name: entry.name,
        itemCount: entry.itemCount,
        minutes: entry.minutes,
        uses: [...entry.uses],
        primary: entry.primary,
        safetyItem: questionnaireForms[entry.variant].safetyItem !== null,
        satepsi: { status: entry.satepsi, checkedOn: satepsiCheckedOn },
        unavailableReason: unavailableReasonOf(entry.variant, kind, patientLocale),
      })),
    })),
  }
}

export function detailOf(
  variant: QuestionnaireVariant,
  answers: number[],
  overrides: Partial<AssignmentDetail> = {},
): AssignmentDetail {
  const { score, flags } = scoreQuestionnaire(variant, answers)
  const completedAt = '2026-10-21T15:00:00.000Z'
  const base = assignment({
    variant,
    status: 'completed',
    completedAt,
    result: { total: score.total, max: score.max, band: score.band, flags },
  })
  return {
    assignment: base,
    complementarySource: true,
    response: {
      locale: 'pt-BR',
      instrumentVersion: `${variant}@1`,
      consentedAt: '2026-10-21T14:55:00.000Z',
      startedAt: '2026-10-21T14:55:00.000Z',
      completedAt,
      answers,
      score,
      flags,
    },
    trend: [{ assignmentId: base.id, completedAt, total: score.total, band: score.band }],
    ...overrides,
  }
}
