import { catalogEntryOf, type QuestionnaireVariant } from './catalog.ts'
import { questionnaireForms } from './forms.ts'

export type DraftAnswers = readonly (number | null)[]

export class InvalidQuestionnaireAnswerError extends Error {
  constructor(variant: QuestionnaireVariant) {
    super(`${catalogEntryOf(variant).name} does not accept this answer`)
    this.name = 'InvalidQuestionnaireAnswerError'
  }
}

export function blankAnswers(variant: QuestionnaireVariant): (number | null)[] {
  return Array.from({ length: catalogEntryOf(variant).itemCount }, () => null)
}

export function isAllowedValue(variant: QuestionnaireVariant, value: unknown): value is number {
  return questionnaireForms[variant].values.some((allowed) => allowed === value)
}

export function isDraftOf(
  variant: QuestionnaireVariant,
  answers: unknown,
): answers is DraftAnswers {
  return (
    Array.isArray(answers) &&
    answers.length === catalogEntryOf(variant).itemCount &&
    answers.every((answer) => answer === null || isAllowedValue(variant, answer))
  )
}

export function withAnswer(
  variant: QuestionnaireVariant,
  answers: DraftAnswers,
  item: number,
  value: number,
): (number | null)[] {
  if (
    !isDraftOf(variant, answers) ||
    !Number.isInteger(item) ||
    item < 0 ||
    item >= answers.length ||
    !isAllowedValue(variant, value)
  ) {
    throw new InvalidQuestionnaireAnswerError(variant)
  }
  return answers.map((answer, index) => (index === item ? value : answer))
}

export function completeAnswers(
  variant: QuestionnaireVariant,
  answers: DraftAnswers,
): number[] | null {
  if (!isDraftOf(variant, answers)) {
    return null
  }
  const complete = answers.filter((answer) => answer !== null)
  return complete.length === answers.length ? complete : null
}

export function answeredCount(answers: DraftAnswers): number {
  return answers.filter((answer) => answer !== null).length
}

export function nextUnanswered(answers: DraftAnswers): number {
  const index = answers.indexOf(null)
  return index === -1 ? answers.length : index
}
