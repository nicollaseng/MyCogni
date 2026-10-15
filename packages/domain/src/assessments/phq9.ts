import type { Instrument } from './instrument.ts'

export const phq9: Instrument = {
  id: 'phq9',
  name: 'PHQ-9',
  itemCount: 9,
  bands: [
    { severity: 'minimal', min: 0 },
    { severity: 'mild', min: 5 },
    { severity: 'moderate', min: 10 },
    { severity: 'moderately_severe', min: 15 },
    { severity: 'severe', min: 20 },
  ],
  riskItemIndex: 8,
}
