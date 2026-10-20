import { describe, expect, it } from '@jest/globals'
import { articleIds, trackIds, tracks } from '../catalog.ts'
import { readingMinutes, wordCountOf } from '../reading.ts'
import { articles } from './articles/articles.ts'
import { contentLanguageOf } from './language.ts'
import { trackText } from './tracks/tracks.ts'
import { contentLanguages } from './types.ts'

const languages = contentLanguages

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

  it.each(articleIds)('keeps questionnaire names and scores out of the text of %s', (id) => {
    for (const language of languages) {
      const text = articles[id].text[language]
      const written = [
        text.title,
        text.summary,
        ...text.sections.flatMap((section) => [section.heading ?? '', ...section.paragraphs]),
      ].join(' ')
      expect(written).not.toMatch(/PHQ|GAD|\b(de|of) (27|21)\b/)
    }
  })

  it('lists references with secure links only', () => {
    for (const id of articleIds) {
      for (const reference of articles[id].references) {
        expect(reference.citation.trim()).not.toBe('')
        expect(reference.url).toMatch(/^https:\/\/[^\s/]+\.[^\s]+$/)
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
      expect(
        Object.values(text.steps)
          .map((step) => step.body)
          .join(' '),
      ).not.toMatch(/PHQ|GAD/)
    }
  })
})

describe('readingMinutes', () => {
  it('rounds up at 200 words a minute and never says zero', () => {
    const paragraph = (words: number) => Array.from({ length: words }, () => 'palavra').join(' ')
    expect(
      readingMinutes({ title: 'T', summary: '', sections: [{ paragraphs: [paragraph(401)] }] }),
    ).toBe(3)
    expect(readingMinutes({ title: 'T', summary: '', sections: [{ paragraphs: [''] }] })).toBe(1)
  })
})

describe('contentLanguageOf', () => {
  it('shares the English content between the American and British locales', () => {
    expect(contentLanguageOf('en-GB')).toBe('en')
    expect(contentLanguageOf('en-US')).toBe('en')
    expect(contentLanguageOf('pt-PT')).toBe('pt-PT')
  })
})
