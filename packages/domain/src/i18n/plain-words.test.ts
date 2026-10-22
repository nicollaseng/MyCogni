import { describe, expect, it } from '@jest/globals'
import { labelsFor } from './labels/labels.ts'
import { plainWordsOf } from './plain-words.ts'

describe('plainWordsOf', () => {
  it('names the depression questionnaire desânimo and folds the two highest bands into alto', () => {
    expect(plainWordsOf('pt-BR', 'phq9', 'severe')).toEqual({ topic: 'desânimo', level: 'alto' })
    expect(plainWordsOf('pt-BR', 'gad7', 'mild')).toEqual({ topic: 'ansiedade', level: 'leve' })
    expect(plainWordsOf('pt-BR', 'phq2', 'minimal')).toEqual({ topic: 'desânimo', level: 'baixo' })
  })

  it('speaks each language with its own words', () => {
    expect(plainWordsOf('pt-PT', 'gad7', 'mild')).toEqual({ topic: 'ansiedade', level: 'ligeiro' })
    expect(plainWordsOf('en-US', 'phq9', 'moderately_severe')).toEqual({
      topic: 'feeling down',
      level: 'high',
    })
    expect(plainWordsOf('en-GB', 'gad7', 'minimal')).toEqual({ topic: 'anxiety', level: 'low' })
  })

  it('keeps the plain words free of questionnaire names', () => {
    for (const locale of ['pt-BR', 'pt-PT', 'en-US', 'en-GB'] as const) {
      const labels = labelsFor(locale)
      expect(Object.values({ ...labels.plainNames, ...labels.plainLevels }).join(' ')).not.toMatch(
        /PHQ|GAD/,
      )
    }
  })
})
