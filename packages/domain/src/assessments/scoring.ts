import { isAnswer } from './frequency.ts'
import { gad2 } from './gad2.ts'
import { gad7 } from './gad7.ts'
import type { Instrument, InstrumentId, ScreeningDomain, Severity } from './instrument.ts'
import { phq2 } from './phq2.ts'
import { phq9 } from './phq9.ts'
import { isPositiveScreen, isShortScreen } from './screens.ts'

export interface AssessmentScore {
  totalScore: number
  severity: Severity
  hasRiskFlag: boolean
}

export class InvalidAnswersError extends Error {
  constructor(instrument: Instrument) {
    super(`${instrument.name} expects ${String(instrument.itemCount)} answers from 0 to 3`)
    this.name = 'InvalidAnswersError'
  }
}

export class PositiveScreenError extends Error {
  constructor(screen: Instrument) {
    super(`${screen.name} is positive, so the full form has to be answered`)
    this.name = 'PositiveScreenError'
  }
}

export const instruments: Readonly<Record<InstrumentId, Instrument>> = { phq9, gad7, phq2, gad2 }

export function domainOf(id: InstrumentId): ScreeningDomain {
  return instruments[id].domain
}

export function maxScoreOf(instrument: Instrument): number {
  return instrument.scoredItems * 3
}

export function isStorable(instrument: Instrument, answers: readonly number[]): boolean {
  return !isShortScreen(instrument) || !isPositiveScreen(instrument.domain, answers)
}

export function scoreAssessment(
  instrument: Instrument,
  answers: readonly number[],
): AssessmentScore {
  if (answers.length !== instrument.itemCount || !answers.every(isAnswer)) {
    throw new InvalidAnswersError(instrument)
  }
  if (!isStorable(instrument, answers)) {
    throw new PositiveScreenError(instrument)
  }

  const totalScore = answers
    .slice(0, instrument.scoredItems)
    .reduce<number>((sum, answer) => sum + answer, 0)

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
