import { describe, expect, it } from '@jest/globals'
import { articleIds, trackIds, tracks } from '@mycogni/domain'
import { wordCountOf } from '../reading'
import { articles } from './articles'
import { trackText } from './tracks'
import type { ContentLanguage } from './types'

const languages: readonly ContentLanguage[] = ['pt-BR', 'pt-PT', 'en']

describe('articles', () => {
  it.each(articleIds)('keeps %s between 500 and 900 words in every language', (id) => {
    for (const language of languages) {
      const words = wordCountOf(articles[id].text[language])
      expect(words).toBeGreaterThanOrEqual(500)
      expect(words).toBeLessThanOrEqual(900)
    }
  })

  it.each(articleIds)('gives %s the same shape in every language', (id) => {
    const [first, ...others] = languages.map((language) => articles[id].text[language])
    for (const other of others) {
      expect(other.sections.map((section) => section.paragraphs.length)).toEqual(
        first?.sections.map((section) => section.paragraphs.length),
      )
    }
    expect(articles[id].id).toBe(id)
  })

  it('lists references with secure links only', () => {
    for (const id of articleIds) {
      for (const reference of articles[id].references) {
        expect(reference.citation.trim()).not.toBe('')
        expect(new URL(reference.url).protocol).toBe('https:')
      }
    }
  })
})

describe('tracks', () => {
  it.each(trackIds)('writes every step of %s in every language', (id) => {
    for (const language of languages) {
      const text = trackText(language, id)
      expect(Object.keys(text.steps).sort()).toEqual(tracks[id].steps.map((step) => step.id).sort())
      expect(text.title).not.toBe('')
    }
  })
})
