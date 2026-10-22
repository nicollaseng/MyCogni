import { memoryKinds, type MemoryKind } from '@mycogni/domain'
import type { ShownMemory } from './shown-memory'

const position: Record<MemoryKind, number> = {
  coping: 0,
  routine: 1,
  relationship: 2,
  goal: 3,
  preference: 4,
  trigger: 5,
  event: 6,
  fact: 7,
}

export const groupOrder: readonly MemoryKind[] = [...memoryKinds].sort(
  (first, second) => position[first] - position[second],
)

export interface MemoryGroup {
  kind: MemoryKind
  memories: ShownMemory[]
}

export function groupMemories(memories: readonly ShownMemory[]): MemoryGroup[] {
  return groupOrder
    .map((kind) => ({ kind, memories: memories.filter((memory) => memory.kind === kind) }))
    .filter((group) => group.memories.length > 0)
}
