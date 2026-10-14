import { isAnswer } from './frequency.ts'
import { gad7 } from './gad7.ts'
import type { Instrument, InstrumentId, Severity } from './instrument.ts'
import { phq9 } from './phq9.ts'

export interface AssessmentScore {
  totalScore: number
  severity: Severity
  hasRiskFlag: boolean
}

export class InvalidAnswersError extends Error {
  constructor(instrument: Instrument) {
    super(`${instrument.name} expects ${String(instrument.items.length)} answers from 0 to 3`)
    this.name = 'InvalidAnswersError'
  }
}

export const instruments: Record<InstrumentId, Instrument> = { phq9, gad7 }

export function maxScoreOf(instrument: Instrument): number {
  return instrument.items.length * 3
}

export function scoreAssessment(
  instrument: Instrument,
  answers: readonly number[],
): AssessmentScore {
  if (answers.length !== instrument.items.length || !answers.every(isAnswer)) {
    throw new InvalidAnswersError(instrument)
  }

  const totalScore = answers.reduce<number>((sum, answer) => sum + answer, 0)

  return {
    totalScore,
    severity: severityOf(instrument, totalScore),
    hasRiskFlag: answers.some((answer, index) => index === instrument.riskItemIndex && answer > 0),
  }
}

function severityOf({ bands }: Instrument, totalScore: number): Severity {
  const [lowest, ...higher] = bands
  return higher.reduce((band, next) => (totalScore >= next.min ? next : band), lowest).severity
}
