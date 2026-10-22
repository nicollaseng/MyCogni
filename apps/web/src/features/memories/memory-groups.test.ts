import { describe, expect, it } from '@jest/globals'
import { memoryKinds, type MemoryKind } from '@mycogni/domain'
import { groupMemories, groupOrder } from './memory-groups'
import type { ShownMemory } from './shown-memory'

function memory(id: string, kind: MemoryKind): ShownMemory {
  return { id, content: `Memória ${id}`, kind, status: 'active', hint: null }
}

describe('groupMemories', () => {
  it('orders the groups from what helps to what is about the person', () => {
    expect(groupOrder).toEqual([
      'coping',
      'routine',
      'relationship',
      'goal',
      'preference',
      'trigger',
      'event',
      'fact',
    ])
    expect([...groupOrder].sort()).toEqual([...memoryKinds].sort())
  })

  it('keeps only the kinds that have memories, each in its own order', () => {
    const groups = groupMemories([
      memory('1', 'fact'),
      memory('2', 'coping'),
      memory('3', 'trigger'),
      memory('4', 'coping'),
      memory('5', 'routine'),
    ])

    expect(groups.map((group) => group.kind)).toEqual(['coping', 'routine', 'trigger', 'fact'])
    expect(groups[0]?.memories.map((item) => item.id)).toEqual(['2', '4'])
  })

  it('has no groups when nothing is kept', () => {
    expect(groupMemories([])).toEqual([])
  })
})
