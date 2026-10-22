import type { Memory } from '@mycogni/contracts'

export type SourceHint =
  { key: 'manual' | 'conversation' | 'journal' } | { key: 'checkIn'; at: string }

export function sourceHintOf(memory: Pick<Memory, 'origin' | 'sources'>): SourceHint | null {
  if (memory.origin === 'manual') {
    return { key: 'manual' }
  }
  const [first] = memory.sources
  if (first === undefined) {
    return null
  }
  switch (first.kind) {
    case 'check_in':
    case 'addendum':
      return { key: 'checkIn', at: first.at }
    case 'journal':
      return { key: 'journal' }
    case 'conversation':
      return { key: 'conversation' }
  }
}
