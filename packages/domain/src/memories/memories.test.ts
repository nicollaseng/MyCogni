import { describe, expect, it } from '@jest/globals'
import {
  importanceOf,
  isMemoryContent,
  isMemoryKind,
  isNearDuplicate,
  isSafeMemory,
  memoryLimits,
  memorySimilarity,
  normalizeMemory,
  planMemoryChanges,
  type KnownMemory,
  type MemoryOperation,
} from './memories.ts'

const memories: readonly KnownMemory[] = [
  { ref: 'M1', content: 'Caminha depois do almoço para se acalmar.', editable: true },
  { ref: 'M2', content: 'A irmã Ana é quem mais apoia.', editable: false },
  { ref: 'M3', content: 'Quer dormir antes da meia-noite.', editable: true },
]

const sources = ['c1', 'a1', 'j1', 'm1']

function plan(operations: readonly MemoryOperation[]) {
  return planMemoryChanges(operations, { memories, sources })
}

function add(content: string, refs: readonly string[] = ['c1']): MemoryOperation {
  return { op: 'add', content, kind: 'coping', importance: 2, sources: refs }
}

describe('memory content', () => {
  it('keeps one short line between 1 and 280 characters', () => {
    expect(normalizeMemory('  Gosta   de\ncorrer  ')).toBe('Gosta de correr')
    expect(isMemoryContent('Gosta de correr')).toBe(true)
    expect(isMemoryContent('   ')).toBe(false)
    expect(isMemoryContent('a'.repeat(memoryLimits.content))).toBe(true)
    expect(isMemoryContent('a'.repeat(memoryLimits.content + 1))).toBe(false)
  })

  it('knows the kinds of memory', () => {
    expect(isMemoryKind('coping')).toBe(true)
    expect(isMemoryKind('diagnosis')).toBe(false)
  })

  it('keeps the importance between 1 and 3', () => {
    expect([0, 1, 1.6, 2, 2.4, 3, 7].map(importanceOf)).toEqual([1, 1, 1, 2, 2, 3, 3])
  })

  it('refuses crisis content as a memory', () => {
    expect(isSafeMemory('Gosta de cozinhar com a mãe no domingo.')).toBe(true)
    expect(isSafeMemory('Quer se matar quando fica sozinho.')).toBe(false)
  })
})

describe('near duplicates', () => {
  it('compares the words, ignoring accents, case and punctuation', () => {
    expect(memorySimilarity('Caminha depois do almoço', 'caminha, depois do ALMOCO!')).toBe(1)
    expect(memorySimilarity('Gosta de café', 'Prefere chá verde')).toBe(0)
    expect(memorySimilarity('!!!', '...')).toBe(1)
  })

  it('treats close wordings as the same memory', () => {
    expect(
      isNearDuplicate(
        'Caminha depois do almoço para se acalmar.',
        'Caminha depois do almoço para se acalmar um pouco.',
      ),
    ).toBe(true)
    expect(isNearDuplicate('Caminha depois do almoço.', 'Dorme mal antes de provas.')).toBe(false)
  })
})

describe('planning the changes from the model', () => {
  it('adds a new memory with the sources it came from', () => {
    expect(plan([{ ...add('  Toca violão   para relaxar. ', ['c1', 'c1', 'x9']) }])).toEqual([
      {
        change: 'add',
        content: 'Toca violão para relaxar.',
        kind: 'coping',
        importance: 2,
        sources: ['c1'],
      },
    ])
  })

  it('drops additions without a known source, too long or about a crisis', () => {
    expect(
      plan([
        add('Toca violão para relaxar.', ['x9']),
        add('a'.repeat(memoryLimits.content + 1)),
        add('Pensa em se matar à noite.'),
      ]),
    ).toEqual([])
  })

  it('links a repeated memory to the new source instead of adding it again', () => {
    expect(plan([add('Caminha depois do almoço para se acalmar.', ['a1'])])).toEqual([
      { change: 'link', ref: 'M1', sources: ['a1'] },
    ])
    expect(
      plan([
        add('Caminha depois do almoço para se acalmar.', ['a1']),
        add('Caminha depois do almoço, para se acalmar.', ['j1']),
      ]),
    ).toEqual([{ change: 'link', ref: 'M1', sources: ['a1', 'j1'] }])
  })

  it('never rewrites or links what the person wrote', () => {
    expect(
      plan([
        add('A irmã Ana é quem mais apoia.'),
        { op: 'update', id: 'M2', content: 'A irmã Ana ajuda muito.', importance: 3, sources: [] },
        { op: 'archive', id: 'M2' },
      ]),
    ).toEqual([])
  })

  it('merges near-duplicate additions from the same run', () => {
    expect(
      plan([add('Toca violão para relaxar.', ['c1']), add('Toca violão para relaxar!', ['m1'])]),
    ).toEqual([
      {
        change: 'add',
        content: 'Toca violão para relaxar.',
        kind: 'coping',
        importance: 2,
        sources: ['c1', 'm1'],
      },
    ])
  })

  it('updates a learned memory once, keeping the sources of an earlier link', () => {
    expect(
      plan([
        add('Caminha depois do almoço para se acalmar.', ['a1']),
        {
          op: 'update',
          id: 'M1',
          content: 'Caminha depois do almoço e à noite para se acalmar.',
          importance: 5,
          sources: ['j1', 'x9'],
        },
        { op: 'update', id: 'M1', content: 'Outra versão.', importance: 1, sources: [] },
        add('Caminha depois do almoço para se acalmar.', ['m1']),
      ]),
    ).toEqual([
      {
        change: 'update',
        ref: 'M1',
        content: 'Caminha depois do almoço e à noite para se acalmar.',
        importance: 3,
        sources: ['a1', 'j1'],
      },
    ])
  })

  it('ignores updates to unknown memories, unsafe text or a copy of another memory', () => {
    expect(
      plan([
        { op: 'update', id: 'M9', content: 'Nada.', importance: 2, sources: [] },
        { op: 'update', id: 'M1', content: 'Pensa em se matar.', importance: 2, sources: [] },
        {
          op: 'update',
          id: 'M3',
          content: 'A irmã Ana é quem mais apoia.',
          importance: 2,
          sources: [],
        },
      ]),
    ).toEqual([])
  })

  it('archives a learned memory and forgets a pending link to it', () => {
    expect(
      plan([
        add('Quer dormir antes da meia-noite.', ['c1']),
        { op: 'archive', id: 'M3' },
        { op: 'archive', id: 'M3' },
        { op: 'archive', id: 'M9' },
      ]),
    ).toEqual([{ change: 'archive', ref: 'M3' }])
  })

  it('stops at the change limit for one run', () => {
    const many = Array.from({ length: memoryLimits.changes + 5 }, (_, index) =>
      add(`Pratica a atividade x${String(index)}y`),
    )
    expect(plan(many)).toHaveLength(memoryLimits.changes)
  })
})
