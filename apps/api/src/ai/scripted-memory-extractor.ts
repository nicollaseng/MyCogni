import type { MemoryOperation } from '@mycogni/domain'
import type { ExtractionInput, MemoryExtractor } from './memory-extractor.ts'

interface ScriptedMemory {
  pattern: RegExp
  kind: 'coping' | 'routine' | 'relationship'
  pt: string
  en: string
}

const script: readonly ScriptedMemory[] = [
  {
    pattern: /caminh|walk/i,
    kind: 'coping',
    pt: 'Caminhar ajuda a se acalmar.',
    en: 'Walking helps them calm down.',
  },
  {
    pattern: /dorm|durm|sleep/i,
    kind: 'routine',
    pt: 'Tenta dormir mais cedo nos dias de semana.',
    en: 'Tries to go to bed earlier on weekdays.',
  },
  {
    pattern: /irmã|sister/i,
    kind: 'relationship',
    pt: 'A irmã é uma pessoa importante de apoio.',
    en: 'Their sister is an important source of support.',
  },
]

export function createScriptedMemoryExtractor(): MemoryExtractor {
  return {
    model: 'scripted',
    extract(input: ExtractionInput) {
      const english = input.locale.startsWith('en')
      const operations = script.flatMap((memory): MemoryOperation[] => {
        const sources = input.items
          .filter((item) => memory.pattern.test(item.text))
          .map((item) => item.id)
        return sources.length === 0
          ? []
          : [
              {
                op: 'add',
                content: english ? memory.en : memory.pt,
                kind: memory.kind,
                importance: 2,
                sources,
              },
            ]
      })
      return Promise.resolve(operations)
    },
  }
}
