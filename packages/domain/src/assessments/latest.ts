import type { InstrumentId, ScreeningDomain } from './instrument.ts'
import { domainOf } from './scoring.ts'

export interface DomainRecord {
  instrument: InstrumentId
  completedAt: Date | string
}

export type LatestPerDomain<Item> = Partial<Readonly<Record<ScreeningDomain, Item>>>

function timeOf(moment: Date | string): number {
  return typeof moment === 'string' ? Date.parse(moment) : moment.getTime()
}

export function latestPerDomain<Item extends DomainRecord>(
  records: readonly Item[],
  since: Date | null = null,
): LatestPerDomain<Item> {
  const from = since?.getTime() ?? Number.NEGATIVE_INFINITY
  const latest: Partial<Record<ScreeningDomain, Item>> = {}
  for (const record of records) {
    const time = timeOf(record.completedAt)
    const domain = domainOf(record.instrument)
    const current = latest[domain]
    if (time >= from && (current === undefined || time > timeOf(current.completedAt))) {
      latest[domain] = record
    }
  }
  return latest
}
