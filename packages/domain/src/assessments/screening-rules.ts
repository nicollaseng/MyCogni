import type { ScreeningDomain } from './instrument.ts'

export const askSafetyItemToAll = true

export const safetyItem = 8

export const positiveScreenScores: Readonly<Record<ScreeningDomain, number>> = {
  depression: 3,
  anxiety: 3,
}
