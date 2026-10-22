import type { Instrument } from './instrument.ts'

const items = [0, 1] as const

export const gad2: Instrument = {
  id: 'gad2',
  name: 'GAD-2',
  domain: 'anxiety',
  items,
  itemCount: items.length,
  scoredItems: items.length,
  bands: [{ severity: 'minimal', min: 0 }],
  riskItemIndex: null,
}
