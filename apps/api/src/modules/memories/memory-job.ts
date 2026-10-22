import {
  dayKey,
  isLocale,
  isSafeMemory,
  memoryLimits,
  planMemoryChanges,
  type Locale,
  type MemoryChange,
  type MemorySourceKind,
} from '@mycogni/domain'
import type { MemoryExtractor } from '../../ai/memory-extractor.ts'
import type {
  MemoryExtractionRepository,
  ResolvedChange,
  SourceItem,
  SourceLink,
  StoredMemory,
} from './memory-extraction.repository.ts'

export type MemoryRunResult =
  | { kind: 'skipped'; reason: 'no_profile' | 'disabled' | 'nothing_new' | 'ai_disabled' }
  | { kind: 'applied'; changes: number; more: boolean }

export interface MemoryJob {
  run(userId: string): Promise<MemoryRunResult>
}

export interface MemoryJobDependencies {
  memories: MemoryExtractionRepository
  extractor: MemoryExtractor | null
  backlog: (userId: string) => Promise<void>
  now: () => Date
}

const fallbackLocale: Locale = 'pt-BR'

const dayInMilliseconds = 24 * 60 * 60 * 1000

const refPrefix = {
  check_in: 'c',
  addendum: 'a',
  journal: 'j',
  conversation: 'm',
} as const satisfies Record<MemorySourceKind, string>

interface RefItem {
  ref: string
  item: SourceItem
}

function itemRefs(items: readonly SourceItem[]): RefItem[] {
  const counters = new Map<MemorySourceKind, number>()
  return items.map((item) => {
    const next = (counters.get(item.kind) ?? 0) + 1
    counters.set(item.kind, next)
    return { ref: `${refPrefix[item.kind]}${String(next)}`, item }
  })
}

function memoryRefs(memories: readonly StoredMemory[]): Map<string, StoredMemory> {
  return new Map(memories.map((memory, index) => [`M${String(index + 1)}`, memory]))
}

function resolve(
  changes: readonly MemoryChange[],
  sources: ReadonlyMap<string, SourceLink>,
  memories: ReadonlyMap<string, StoredMemory>,
): ResolvedChange[] {
  const links = (refs: readonly string[]) =>
    refs.flatMap((ref) => {
      const link = sources.get(ref)
      return link === undefined ? [] : [link]
    })
  return changes.flatMap((change): ResolvedChange[] => {
    if (change.change === 'add') {
      return [{ ...change, sources: links(change.sources) }]
    }
    const memory = memories.get(change.ref)
    if (memory === undefined) {
      return []
    }
    switch (change.change) {
      case 'update':
        return [
          {
            change: 'update',
            id: memory.id,
            content: change.content,
            importance: change.importance,
            sources: links(change.sources),
          },
        ]
      case 'link':
        return [{ change: 'link', id: memory.id, sources: links(change.sources) }]
      case 'archive':
        return [{ change: 'archive', id: memory.id }]
    }
  })
}

export function createMemoryJob({
  memories,
  extractor,
  backlog,
  now,
}: MemoryJobDependencies): MemoryJob {
  return {
    async run(userId) {
      if (extractor === null) {
        return { kind: 'skipped', reason: 'ai_disabled' }
      }
      const settings = await memories.settings(userId)
      if (settings === undefined) {
        return { kind: 'skipped', reason: 'no_profile' }
      }
      if (!settings.enabled) {
        return { kind: 'skipped', reason: 'disabled' }
      }
      const since =
        settings.readUntil ??
        new Date(now().getTime() - memoryLimits.lookbackDays * dayInMilliseconds)
      const found = await memories.items(userId, {
        since,
        journal: settings.journal,
        limit: memoryLimits.items + 1,
      })
      const batch = found.slice(0, memoryLimits.items)
      const last = batch.at(-1)
      if (last === undefined) {
        return { kind: 'skipped', reason: 'nothing_new' }
      }
      const more = found.length > batch.length
      const refs = itemRefs(batch.filter((item) => isSafeMemory(item.text)))
      const sources = new Map(
        refs.map(({ ref, item }) => [ref, { kind: item.kind, id: item.id } satisfies SourceLink]),
      )
      const known = memoryRefs(await memories.memories(userId, memoryLimits.known))
      const operations =
        refs.length === 0
          ? []
          : await extractor.extract({
              locale: isLocale(settings.locale) ? settings.locale : fallbackLocale,
              memories: [...known].map(([id, memory]) => ({
                id,
                content: memory.content,
                kind: memory.kind,
                editable: memory.origin === 'extracted',
              })),
              items: refs.map(({ ref, item }) => ({
                id: ref,
                source: item.kind,
                day: dayKey(item.at, settings.timezone),
                text: item.text.slice(0, memoryLimits.itemText),
              })),
            })
      const changes = resolve(
        planMemoryChanges(operations ?? [], {
          memories: [...known].map(([ref, memory]) => ({
            ref,
            content: memory.content,
            editable: memory.origin === 'extracted',
          })),
          sources: [...sources.keys()],
        }),
        sources,
        known,
      )
      await memories.apply(userId, changes, last.at)
      if (more) {
        await backlog(userId)
      }
      return { kind: 'applied', changes: changes.length, more }
    },
  }
}
