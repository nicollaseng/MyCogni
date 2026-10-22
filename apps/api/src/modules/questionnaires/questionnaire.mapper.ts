import {
  questionnaireScoreSchema,
  type AnsweredQuestionnaire,
  type AssignmentDetail,
  type PatientAssignment,
  type ProfessionalAssignment,
  type QuestionnaireRun,
  type QuestionnaireScoreView,
} from '@mycogni/contracts'
import {
  answeredCount,
  blankAnswers,
  catalogEntryOf,
  isDraftOf,
  isLocale,
  isQuestionnaireVariant,
  isRepeatInterval,
  plainSummaryOf,
  questionnaireFlags,
  questionnaireText,
  type DraftAnswers,
  type QuestionnaireFlag,
  type QuestionnaireResult,
  type QuestionnaireVariant,
} from '@mycogni/domain'
import type { PatientAssignmentRecord } from './patient-questionnaire.repository.ts'
import type { TrendPoint } from './professional-questionnaire.repository.ts'
import type {
  AssignmentRecord,
  AssignmentWithResponse,
  ResponseRecord,
} from './questionnaire-records.ts'

export interface KnownAssignment extends AssignmentWithResponse {
  variant: QuestionnaireVariant
}

export function knownVariant<T extends AssignmentWithResponse>(
  record: T,
): (T & { variant: QuestionnaireVariant }) | null {
  const { variant } = record.assignment
  return isQuestionnaireVariant(variant) ? { ...record, variant } : null
}

export function flagsOf(flags: readonly string[]): QuestionnaireFlag[] {
  return questionnaireFlags.filter((flag) => flags.includes(flag))
}

export function scoreOf(score: unknown): QuestionnaireScoreView | null {
  const parsed = questionnaireScoreSchema.safeParse(score)
  return parsed.success ? parsed.data : null
}

export function resultOf(response: ResponseRecord | null): QuestionnaireResult | null {
  if (response?.completedAt == null) {
    return null
  }
  const score = scoreOf(response.score)
  return score === null ? null : { score, flags: flagsOf(response.flags) }
}

export function toResponseDetail(response: ResponseRecord | null): AssignmentDetail['response'] {
  const result = resultOf(response)
  if (
    response === null ||
    result === null ||
    response.completedAt === null ||
    !isLocale(response.locale) ||
    !Array.isArray(response.answers)
  ) {
    return null
  }
  return {
    locale: response.locale,
    instrumentVersion: response.instrumentVersion,
    consentedAt: response.consentedAt.toISOString(),
    startedAt: response.startedAt.toISOString(),
    completedAt: response.completedAt.toISOString(),
    answers: response.answers.filter((answer) => typeof answer === 'number'),
    score: result.score,
    flags: result.flags,
  }
}

export function toTrend(points: readonly TrendPoint[]): AssignmentDetail['trend'] {
  return points.flatMap(({ assignmentId, completedAt, score }) => {
    const parsed = scoreOf(score)
    return parsed === null
      ? []
      : [
          {
            assignmentId,
            completedAt: completedAt.toISOString(),
            total: parsed.total,
            band: parsed.band,
          },
        ]
  })
}

export function draftOf(
  variant: QuestionnaireVariant,
  response: ResponseRecord | null,
): DraftAnswers {
  return response !== null && isDraftOf(variant, response.answers)
    ? response.answers
    : blankAnswers(variant)
}

function iso(moment: Date | null): string | null {
  return moment?.toISOString() ?? null
}

function assignmentFields(assignment: AssignmentRecord, variant: QuestionnaireVariant) {
  return {
    id: assignment.id,
    patientId: assignment.patientId,
    variant,
    instrument: catalogEntryOf(variant).instrument,
    status: assignment.status,
    note: assignment.note,
    repeatEveryDays: isRepeatInterval(assignment.repeatEveryDays)
      ? assignment.repeatEveryDays
      : null,
    availableFrom: assignment.availableFrom.toISOString(),
    createdAt: assignment.createdAt.toISOString(),
    completedAt: iso(assignment.completedAt),
    cancelledAt: iso(assignment.cancelledAt),
  }
}

export function toProfessionalAssignment({
  assignment,
  response,
  variant,
}: KnownAssignment): ProfessionalAssignment {
  const result = resultOf(response)
  return {
    ...assignmentFields(assignment, variant),
    result:
      result === null
        ? null
        : {
            total: result.score.total,
            max: result.score.max,
            band: result.score.band,
            flags: result.flags,
          },
  }
}

export function toPatientAssignment(
  record: PatientAssignmentRecord & { variant: QuestionnaireVariant },
): PatientAssignment | null {
  const { assignment, variant, professional, response } = record
  if (assignment.status !== 'assigned' && assignment.status !== 'in_progress') {
    return null
  }
  const entry = catalogEntryOf(variant)
  return {
    id: assignment.id,
    area: entry.area,
    status: assignment.status,
    itemCount: entry.itemCount,
    minutes: entry.minutes,
    answered: answeredCount(draftOf(variant, response)),
    note: assignment.note,
    availableFrom: assignment.availableFrom.toISOString(),
    professional,
  }
}

export function toAnswered(
  record: PatientAssignmentRecord & { variant: QuestionnaireVariant },
): AnsweredQuestionnaire | null {
  const { assignment, variant, professional, response } = record
  const completedAt = response?.completedAt ?? null
  const result = resultOf(response)
  if (result === null || completedAt === null) {
    return null
  }
  return {
    id: assignment.id,
    area: catalogEntryOf(variant).area,
    completedAt: completedAt.toISOString(),
    summary: plainSummaryOf(variant, result),
    professional,
  }
}

export function toRun(
  record: PatientAssignmentRecord & { variant: QuestionnaireVariant },
): QuestionnaireRun {
  const { assignment, variant, professional, response } = record
  const entry = catalogEntryOf(variant)
  const locale = response !== null && isLocale(response.locale) ? response.locale : null
  const text = locale === null ? null : questionnaireText(variant, locale)
  const result = resultOf(response)
  return {
    id: assignment.id,
    area: entry.area,
    status: assignment.status,
    itemCount: entry.itemCount,
    minutes: entry.minutes,
    note: assignment.note,
    professional,
    content:
      locale === null || text === null
        ? null
        : {
            locale,
            lead: text.lead,
            stem: text.stem,
            items: [...text.items],
            standaloneItems: [...text.standaloneItems],
            options: [...text.options],
            notice: text.notice,
          },
    answers: [...draftOf(variant, response)],
    summary: result === null ? null : plainSummaryOf(variant, result),
  }
}
