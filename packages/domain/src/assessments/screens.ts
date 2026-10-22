import { gad2 } from './gad2.ts'
import { gad7 } from './gad7.ts'
import type { Instrument, ScreeningDomain } from './instrument.ts'
import { phq2 } from './phq2.ts'
import { phq9 } from './phq9.ts'
import { positiveScreenScores } from './screening-rules.ts'

export interface TwoStepScreen {
  screen: Instrument
  full: Instrument
}

export const twoStepScreens: Readonly<Record<ScreeningDomain, TwoStepScreen>> = {
  depression: { screen: phq2, full: phq9 },
  anxiety: { screen: gad2, full: gad7 },
}

export function isShortScreen(instrument: Instrument): boolean {
  return twoStepScreens[instrument.domain].screen.id === instrument.id
}

export function isPositiveScreen(domain: ScreeningDomain, answers: readonly number[]): boolean {
  const { screen } = twoStepScreens[domain]
  const score = answers.slice(0, screen.scoredItems).reduce((sum, answer) => sum + answer, 0)
  return score >= positiveScreenScores[domain]
}
