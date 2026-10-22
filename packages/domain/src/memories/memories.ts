import { normalizeText } from '../safety/crisis-detector.ts'
import { noteRisk } from '../safety/notes.ts'

export const memoryKinds = [
  'fact',
  'routine',
  'preference',
  'goal',
  'trigger',
  'coping',
  'relationship',
  'event',
] as const

export type MemoryKind = (typeof memoryKinds)[number]

export const memoryOrigins = ['extracted', 'manual'] as const

export type MemoryOrigin = (typeof memoryOrigins)[number]

export const memoryStatuses = ['active', 'archived'] as const

export type MemoryStatus = (typeof memoryStatuses)[number]

export const memorySourceKinds = ['check_in', 'addendum', 'journal', 'conversation'] as const

export type MemorySourceKind = (typeof memorySourceKinds)[number]

export type MemoryImportance = 1 | 2 | 3

export const memoryLimits = {
  content: 280,
  known: 150,
  items: 30,
  itemText: 500,
  changes: 20,
  lookbackDays: 30,
  manualImportance: 3,
  defaultKind: 'fact',
} as const satisfies Record<string, number | MemoryKind>

export const duplicateSimilarity = 0.75

export function normalizeMemory(text: string): string {
  return text.trim().replace(/\s+/g, ' ')
}

export function isMemoryContent(text: string): boolean {
  const content = normalizeMemory(text)
  return content.length > 0 && content.length <= memoryLimits.content
}

export function isMemoryKind(value: string): value is MemoryKind {
  return (memoryKinds as readonly string[]).includes(value)
}

export function importanceOf(value: number): MemoryImportance {
  if (value >= 3) {
    return 3
  }
  return value >= 2 ? 2 : 1
}

function wordsOf(text: string): Set<string> {
  return new Set(
    normalizeText(text)
      .split(/[^\p{L}\p{N}]+/u)
      .filter((word) => word.length > 1),
  )
}

export function memorySimilarity(first: string, second: string): number {
  const left = wordsOf(first)
  const right = wordsOf(second)
  const union = new Set([...left, ...right])
  if (union.size === 0) {
    return 1
  }
  const shared = [...left].filter((word) => right.has(word)).length
  return shared / union.size
}

export function isNearDuplicate(first: string, second: string): boolean {
  return memorySimilarity(first, second) >= duplicateSimilarity
}

export function isSafeMemory(text: string): boolean {
  return noteRisk(text) === 'none'
}

export type MemoryOperation =
  | {
      op: 'add'
      content: string
      kind: MemoryKind
      importance: number
      sources: readonly string[]
    }
  | {
      op: 'update'
      id: string
      content: string
      importance: number
      sources: readonly string[]
    }
  | { op: 'archive'; id: string }

export interface KnownMemory {
  ref: string
  content: string
  editable: boolean
}

export type MemoryChange =
  | {
      change: 'add'
      content: string
      kind: MemoryKind
      importance: MemoryImportance
      sources: string[]
    }
  | {
      change: 'update'
      ref: string
      content: string
      importance: MemoryImportance
      sources: string[]
    }
  | { change: 'link'; ref: string; sources: string[] }
  | { change: 'archive'; ref: string }

interface PlanContext {
  memories: readonly KnownMemory[]
  sources: readonly string[]
}

function usableContent(text: string): string | null {
  const content = normalizeMemory(text)
  return isMemoryContent(content) && isSafeMemory(content) ? content : null
}

function merged(first: readonly string[], second: readonly string[]): string[] {
  return [...new Set([...first, ...second])]
}

export function planMemoryChanges(
  operations: readonly MemoryOperation[],
  { memories, sources }: PlanContext,
): MemoryChange[] {
  const knownSources = new Set(sources)
  const byRef = new Map(memories.map((memory) => [memory.ref, memory]))
  const touched = new Set<string>()
  const changes: MemoryChange[] = []

  function validSources(refs: readonly string[]): string[] {
    return [...new Set(refs.filter((ref) => knownSources.has(ref)))]
  }

  function editable(ref: string): KnownMemory | null {
    const memory = byRef.get(ref)
    return memory?.editable === true && !touched.has(ref) ? memory : null
  }

  function duplicateOf(content: string, except: string | null): KnownMemory | undefined {
    return memories.find(
      (memory) => memory.ref !== except && isNearDuplicate(memory.content, content),
    )
  }

  function takeLink(ref: string): string[] {
    const index = changes.findIndex((change) => change.change === 'link' && change.ref === ref)
    const [taken] = index === -1 ? [] : changes.splice(index, 1)
    return taken?.change === 'link' ? taken.sources : []
  }

  function link(ref: string, refs: string[]): void {
    changes.push({ change: 'link', ref, sources: merged(takeLink(ref), refs) })
  }

  function add(operation: Extract<MemoryOperation, { op: 'add' }>): void {
    const content = usableContent(operation.content)
    const refs = validSources(operation.sources)
    if (content === null || refs.length === 0) {
      return
    }
    const known = duplicateOf(content, null)
    if (known !== undefined) {
      if (known.editable && !touched.has(known.ref)) {
        link(known.ref, refs)
      }
      return
    }
    const planned = changes.find(
      (change): change is Extract<MemoryChange, { change: 'add' }> =>
        change.change === 'add' && isNearDuplicate(change.content, content),
    )
    if (planned !== undefined) {
      planned.sources = merged(planned.sources, refs)
      return
    }
    changes.push({
      change: 'add',
      content,
      kind: operation.kind,
      importance: importanceOf(operation.importance),
      sources: refs,
    })
  }

  function update(operation: Extract<MemoryOperation, { op: 'update' }>): void {
    const memory = editable(operation.id)
    const content = usableContent(operation.content)
    if (memory === null || content === null || duplicateOf(content, memory.ref) !== undefined) {
      return
    }
    touched.add(memory.ref)
    changes.push({
      change: 'update',
      ref: memory.ref,
      content,
      importance: importanceOf(operation.importance),
      sources: merged(takeLink(memory.ref), validSources(operation.sources)),
    })
  }

  function archive(operation: Extract<MemoryOperation, { op: 'archive' }>): void {
    const memory = editable(operation.id)
    if (memory === null) {
      return
    }
    touched.add(memory.ref)
    takeLink(memory.ref)
    changes.push({ change: 'archive', ref: memory.ref })
  }

  for (const operation of operations) {
    if (changes.length >= memoryLimits.changes) {
      break
    }
    if (operation.op === 'add') {
      add(operation)
    } else if (operation.op === 'update') {
      update(operation)
    } else {
      archive(operation)
    }
  }
  return changes
}
