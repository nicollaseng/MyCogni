import type { Instrument } from './instrument.ts'

const items = [0, 1, 2, 3, 4, 5, 6] as const

export const gad7: Instrument = {
  id: 'gad7',
  name: 'GAD-7',
  domain: 'anxiety',
  items,
  itemCount: items.length,
  scoredItems: items.length,
  bands: [
    { severity: 'minimal', min: 0 },
    { severity: 'mild', min: 5 },
    { severity: 'moderate', min: 10 },
    { severity: 'severe', min: 15 },
  ],
  riskItemIndex: null,
}
