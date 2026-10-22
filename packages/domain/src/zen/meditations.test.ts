import { describe, expect, it } from '@jest/globals'
import { meditations } from './content/meditations/meditations.ts'
import { contentLanguages } from './content/types.ts'
import { isMeditationId, isMeditationLength, meditationIds } from './meditation-ids.ts'
import {
  meditationMinutes,
  meditationSeconds,
  meditationSegments,
  meditationText,
  meditationWords,
  spokenSeconds,
} from './meditations.ts'
import { stepMinutes, trackMinutes } from './minutes.ts'
import { topicIds } from './topics.ts'

const forbiddenClaims =
  /\b(cura|curar|cure|cures|cured|trata|tratar|tratamento|treat|treats|treatment|elimina|eliminar|eliminate|eliminates|elimina-se)\b/iu

describe('guided meditations', () => {
  it.each(meditationIds)('gives %s the same structure and real lines in every language', (id) => {
    const meditation = meditations[id]

    expect(meditation.id).toBe(id)
    expect(topicIds).toContain(meditation.topic)
    for (const language of contentLanguages) {
      const text = meditation.text[language]
      expect(text.title.trim()).not.toBe('')
      expect(text.summary.trim()).not.toBe('')
      expect(text.lines).toHaveLength(meditation.plan.length)
      expect(text.lines.every((line) => line.trim().length > 10)).toBe(true)
    }
  })

  it.each(meditationIds)('backs %s with published sources', (id) => {
    for (const reference of meditations[id].references) {
      expect(reference.citation).toMatch(/\d{4}/)
      expect(reference.url).toMatch(/^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/\d+\/$/)
    }
  })

  it.each(meditationIds)('lasts about five or about ten minutes for %s', (id) => {
    for (const language of contentLanguages) {
      const short = meditationSeconds(id, language, 'short')
      const long = meditationSeconds(id, language, 'long')
      expect(short).toBeGreaterThanOrEqual(270)
      expect(short).toBeLessThanOrEqual(330)
      expect(long).toBeGreaterThanOrEqual(570)
      expect(long).toBeLessThanOrEqual(660)
      expect(meditationMinutes(id, language, 'short')).toBe(5)
      expect(meditationMinutes(id, language, 'long')).toBe(10)
    }
  })

  it('keeps the short version inside the long one, with shorter pauses', () => {
    const short = meditationSegments('focus', 'pt-BR', 'short')
    const long = meditationSegments('focus', 'pt-BR', 'long')

    expect(short.length).toBeLessThan(long.length)
    for (const segment of short) {
      const same = long.find((candidate) => candidate.index === segment.index)
      expect(same?.text).toBe(segment.text)
      expect(same?.pause).toBeGreaterThanOrEqual(segment.pause)
    }
    expect(short.at(-1)?.text).toBe(long.at(-1)?.text)
  })

  it('never promises to treat, cure or eliminate anything', () => {
    for (const id of meditationIds) {
      for (const language of contentLanguages) {
        const text = meditationText(id, language)
        for (const line of [text.title, text.summary, ...text.lines]) {
          expect(line).not.toMatch(forbiddenClaims)
        }
      }
    }
  })

  it('points to professional help in the meditations about heavy days and grief', () => {
    expect(meditationText('heavy-days', 'pt-BR').lines.join(' ')).toContain('profissional')
    expect(meditationText('grief', 'en').lines.join(' ')).toContain('professional')
  })

  it('counts a meditation step in a track by its short version', () => {
    expect(stepMinutes({ id: 'meditate', kind: 'meditate', meditation: 'grief' }, 'pt-BR')).toBe(5)
    expect(trackMinutes('everyday-anxiety', 'en')).toBeGreaterThan(5)
  })

  it('counts words and speaking time plainly', () => {
    expect(spokenSeconds('um dois três')).toBeCloseTo((3 / 110) * 60)
    expect(meditationWords('anxiety', 'en')).toBeGreaterThan(250)
    expect(isMeditationId('grief')).toBe(true)
    expect(isMeditationId('sleep')).toBe(false)
    expect(isMeditationLength('long')).toBe(true)
    expect(isMeditationLength('medium')).toBe(false)
  })
})
