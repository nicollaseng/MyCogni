import type { Instrument } from './instrument.ts'

export const gad7: Instrument = {
  id: 'gad7',
  name: 'GAD-7',
  itemCount: 7,
  bands: [
    { severity: 'minimal', min: 0 },
    { severity: 'mild', min: 5 },
    { severity: 'moderate', min: 10 },
    { severity: 'severe', min: 15 },
  ],
  riskItemIndex: null,
}
