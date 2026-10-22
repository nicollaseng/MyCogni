import type { InstrumentId, Severity } from '../assessments/instrument.ts'
import { plainLevelOf } from '../assessments/plain.ts'
import { domainOf } from '../assessments/scoring.ts'
import { labelsFor } from './labels/labels.ts'
import type { Locale } from './locales.ts'

export interface PlainWords {
  topic: string
  level: string
}

export function plainWordsOf(
  locale: Locale,
  instrument: InstrumentId,
  severity: Severity,
): PlainWords {
  const labels = labelsFor(locale)
  return {
    topic: labels.plainNames[domainOf(instrument)].toLocaleLowerCase(locale),
    level: labels.plainLevels[plainLevelOf(severity)].toLocaleLowerCase(locale),
  }
}
