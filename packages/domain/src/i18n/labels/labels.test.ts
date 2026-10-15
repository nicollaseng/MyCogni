import { describe, expect, it } from '@jest/globals'
import { instrumentIds, severities } from '../../assessments/instrument.ts'
import { contextIds, emotionIds } from '../../check-ins/catalog.ts'
import { crisisLinesFor } from '../crisis-lines.ts'
import { locales } from '../locales.ts'
import { moodNames } from './label-set.ts'
import { labelsFor } from './labels.ts'

describe('labelsFor', () => {
  it.each(locales)('names every emotion, context, severity and mood in %s', (locale) => {
    const labels = labelsFor(locale)
    const names = [
      ...emotionIds.map((id) => labels.emotions[id]),
      ...contextIds.map((id) => labels.contexts[id]),
      ...instrumentIds.map((id) => labels.instruments[id]),
      ...severities.map((severity) => labels.severities[severity]),
      ...moodNames.map((mood) => labels.moods[mood]),
    ]

    expect(names.every((name) => name.trim().length > 0)).toBe(true)
  })

  it('speaks each language with its own words', () => {
    expect(labelsFor('pt-BR').emotions.anxiety).toBe('ansiedade')
    expect(labelsFor('pt-PT').severities.mild).toBe('Ligeira')
    expect(labelsFor('en-US').contexts.coworkers).toBe('coworkers')
    expect(labelsFor('en-GB').contexts.coworkers).toBe('colleagues')
    expect(labelsFor('en-GB').emotions.vigor).toBe('vigour')
    expect(labelsFor('en-GB').moods.veryGood).toBe('Very good')
  })
})

describe('crisisLinesFor', () => {
  it.each([
    ['pt-BR', '188'],
    ['pt-PT', '808242424'],
    ['en-US', '988'],
    ['en-GB', '116123'],
  ] as const)('starts the %s lines with %s', (locale, phone) => {
    expect(crisisLinesFor(locale)[0]?.phone).toBe(phone)
  })
})
