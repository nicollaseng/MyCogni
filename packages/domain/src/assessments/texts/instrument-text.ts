import type { InstrumentId } from '../instrument.ts'

export interface InstrumentText {
  prompt: string
  items: readonly string[]
  options: readonly [string, string, string, string]
}

export type InstrumentTexts = Readonly<Record<InstrumentId, InstrumentText>>
