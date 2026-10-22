import type { Instrument } from './instrument.ts'
import { safetyItem } from './screening-rules.ts'

const items = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const

export const phq9: Instrument = {
  id: 'phq9',
  name: 'PHQ-9',
  domain: 'depression',
  items,
  itemCount: items.length,
  scoredItems: items.length,
  bands: [
    { severity: 'minimal', min: 0 },
    { severity: 'mild', min: 5 },
    { severity: 'moderate', min: 10 },
    { severity: 'moderately_severe', min: 15 },
    { severity: 'severe', min: 20 },
  ],
  riskItemIndex: items.indexOf(safetyItem),
}
