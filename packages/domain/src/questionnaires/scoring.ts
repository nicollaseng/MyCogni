import type { PlainLevel } from '../assessments/plain.ts'
import { completeAnswers, InvalidQuestionnaireAnswerError } from './answers.ts'
import { catalogEntryOf, type QuestionnaireVariant } from './catalog.ts'
import {
  questionnaireForms,
  type BandId,
  type ClusterId,
  type ClusterRule,
  type QuestionnaireForm,
  type ShadedRule,
} from './forms.ts'

export const questionnaireFlags = ['risk_item', 'suicide_screen'] as const

export type QuestionnaireFlag = (typeof questionnaireFlags)[number]

export interface ClusterScore {
  id: ClusterId
  total: number
  max: number
  endorsed: number
  required: number
}

export interface ShadedScore {
  count: number
  positive: boolean
}

export interface QuestionnaireScore {
  total: number
  min: number
  max: number
  band: BandId
  clusters: ClusterScore[]
  provisional: boolean | null
  shaded: ShadedScore | null
}

export interface QuestionnaireResult {
  score: QuestionnaireScore
  flags: QuestionnaireFlag[]
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

export function scoreRange(variant: QuestionnaireVariant): { min: number; max: number } {
  const { values } = questionnaireForms[variant]
  const items = catalogEntryOf(variant).itemCount
  return { min: Math.min(...values) * items, max: Math.max(...values) * items }
}

function atThreshold<T extends { min: number }>(steps: readonly [T, ...T[]], total: number): T {
  const [lowest, ...higher] = steps
  return higher.reduce((current, next) => (total >= next.min ? next : current), lowest)
}

export function bandOf(variant: QuestionnaireVariant, total: number): BandId {
  return atThreshold(questionnaireForms[variant].bands, total).id
}

export function plainLevelOfTotal(variant: QuestionnaireVariant, total: number): PlainLevel {
  return atThreshold(questionnaireForms[variant].plain, total).level
}

function clusterScores(rule: ClusterRule, answers: readonly number[], top: number): ClusterScore[] {
  return rule.clusters.map(({ id, items, required }) => {
    const values = answers.filter((_, index) => items.includes(index))
    return {
      id,
      total: sum(values),
      max: items.length * top,
      endorsed: values.filter((value) => value >= rule.endorsedFrom).length,
      required,
    }
  })
}

function shadedScore(rule: ShadedRule, answers: readonly number[]): ShadedScore {
  const count = answers.filter((answer, item) =>
    rule.from.some((threshold, index) => index === item && answer >= threshold),
  ).length
  return { count, positive: count >= rule.positiveAt }
}

function flagsOf(form: QuestionnaireForm, answers: readonly number[], total: number) {
  const flags: QuestionnaireFlag[] = []
  if (answers.some((answer, index) => index === form.safetyItem && answer > 0)) {
    flags.push('risk_item')
  }
  if (form.suicideScreenFrom !== null && total >= form.suicideScreenFrom) {
    flags.push('suicide_screen')
  }
  return flags
}

export function scoreQuestionnaire(
  variant: QuestionnaireVariant,
  draft: readonly (number | null)[],
): QuestionnaireResult {
  const answers = completeAnswers(variant, draft)
  if (answers === null) {
    throw new InvalidQuestionnaireAnswerError(variant)
  }
  const form = questionnaireForms[variant]
  const total = sum(answers)
  const { min, max } = scoreRange(variant)
  const clusters =
    form.clusters === null ? [] : clusterScores(form.clusters, answers, Math.max(...form.values))
  return {
    score: {
      total,
      min,
      max,
      band: bandOf(variant, total),
      clusters,
      provisional:
        form.clusters === null
          ? null
          : clusters.every((cluster) => cluster.endorsed >= cluster.required),
      shaded: form.shaded === null ? null : shadedScore(form.shaded, answers),
    },
    flags: flagsOf(form, answers, total),
  }
}
