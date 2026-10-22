import type { Instrument } from './instrument.ts'
import { askSafetyItemToAll, safetyItem } from './screening-rules.ts'

export function shortDepressionScreen(withSafetyItem: boolean): Instrument {
  const items = withSafetyItem ? [0, 1, safetyItem] : [0, 1]
  return {
    id: 'phq2',
    name: 'PHQ-2',
    domain: 'depression',
    items,
    itemCount: items.length,
    scoredItems: 2,
    bands: [{ severity: 'minimal', min: 0 }],
    riskItemIndex: withSafetyItem ? 2 : null,
  }
}

export const phq2: Instrument = shortDepressionScreen(askSafetyItemToAll)
