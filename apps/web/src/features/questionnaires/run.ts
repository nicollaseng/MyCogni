import type { PatientAssignment, QuestionnaireRun } from '@mycogni/contracts'
import { nextUnanswered } from '@mycogni/domain'

export type RunStep = 'intro' | 'questions' | 'support' | 'summary' | 'closed'

export function initialStep(run: QuestionnaireRun): RunStep {
  if (run.summary !== null) {
    return 'summary'
  }
  if (run.status === 'assigned') {
    return 'intro'
  }
  return run.status === 'in_progress' && run.content !== null ? 'questions' : 'closed'
}

export function resumeIndex(answers: readonly (number | null)[]): number {
  return Math.max(0, Math.min(nextUnanswered(answers), answers.length - 1))
}

export function afterFinish(run: QuestionnaireRun): RunStep {
  return run.summary?.safety === true ? 'support' : 'summary'
}

export function withLocalAnswer(
  answers: readonly (number | null)[],
  item: number,
  value: number,
): (number | null)[] {
  return answers.map((answer, index) => (index === item ? value : answer))
}

export function firstAvailable(open: readonly PatientAssignment[]): PatientAssignment | undefined {
  return [...open].sort(
    (first, second) =>
      Number(second.status === 'in_progress') - Number(first.status === 'in_progress') ||
      first.availableFrom.localeCompare(second.availableFrom),
  )[0]
}
