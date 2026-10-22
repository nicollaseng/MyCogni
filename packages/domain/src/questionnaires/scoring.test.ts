import { describe, expect, it } from '@jest/globals'
import { InvalidQuestionnaireAnswerError } from './answers.ts'
import type { QuestionnaireVariant } from './catalog.ts'
import { instrumentVersionOf } from './forms.ts'
import { bandOf, plainLevelOfTotal, scoreQuestionnaire, scoreRange } from './scoring.ts'
import { scoreSourceReferences, scoreSources } from './sources.ts'

function answersSumming(total: number, items: number, top: number, floor = 0): number[] {
  return Array.from({ length: items }, (_, index) =>
    Math.min(top, Math.max(floor, total - index * top)),
  )
}

describe('questionnaire scoring', () => {
  it.each<[QuestionnaireVariant, number, number]>([
    ['phq9', 0, 27],
    ['phq8', 0, 24],
    ['gad7', 0, 21],
    ['pcl5', 0, 80],
    ['asrs6', 0, 24],
    ['k10', 10, 50],
    ['k6', 0, 24],
  ])('gives %s a range from %i to %i', (variant, min, max) => {
    expect(scoreRange(variant)).toEqual({ min, max })
  })

  it.each<[QuestionnaireVariant, number, string]>([
    ['phq9', 4, 'minimal'],
    ['phq9', 5, 'mild'],
    ['phq9', 9, 'mild'],
    ['phq9', 10, 'moderate'],
    ['phq9', 14, 'moderate'],
    ['phq9', 15, 'moderately_severe'],
    ['phq9', 19, 'moderately_severe'],
    ['phq9', 20, 'severe'],
    ['phq8', 20, 'severe'],
    ['gad7', 4, 'minimal'],
    ['gad7', 5, 'mild'],
    ['gad7', 10, 'moderate'],
    ['gad7', 14, 'moderate'],
    ['gad7', 15, 'severe'],
    ['pcl5', 35, 'below_cutoff'],
    ['pcl5', 36, 'above_cutoff'],
    ['asrs6', 9, 'low_negative'],
    ['asrs6', 10, 'high_negative'],
    ['asrs6', 13, 'high_negative'],
    ['asrs6', 14, 'low_positive'],
    ['asrs6', 17, 'low_positive'],
    ['asrs6', 18, 'high_positive'],
    ['k10', 15, 'distress_low'],
    ['k10', 16, 'distress_moderate'],
    ['k10', 21, 'distress_moderate'],
    ['k10', 22, 'distress_high'],
    ['k10', 29, 'distress_high'],
    ['k10', 30, 'distress_very_high'],
    ['k6', 12, 'below_cutoff'],
    ['k6', 13, 'serious_distress'],
  ])('puts %s %i in the %s band', (variant, total, band) => {
    expect(bandOf(variant, total)).toBe(band)
  })

  it.each<[QuestionnaireVariant, number, string]>([
    ['phq9', 4, 'low'],
    ['phq9', 15, 'high'],
    ['gad7', 10, 'moderate'],
    ['pcl5', 19, 'low'],
    ['pcl5', 20, 'mild'],
    ['pcl5', 36, 'moderate'],
    ['pcl5', 60, 'high'],
    ['asrs6', 13, 'mild'],
    ['asrs6', 18, 'high'],
    ['k10', 16, 'mild'],
    ['k10', 30, 'high'],
    ['k6', 5, 'low'],
    ['k6', 6, 'mild'],
    ['k6', 13, 'moderate'],
    ['k6', 18, 'high'],
  ])('maps %s %i to the plain %s level', (variant, total, level) => {
    expect(plainLevelOfTotal(variant, total)).toBe(level)
  })

  it('flags PHQ-9 item 9 above zero and nothing else for the PHQ-9', () => {
    const result = scoreQuestionnaire('phq9', [0, 0, 0, 0, 0, 0, 0, 0, 1])
    expect(result.flags).toEqual(['risk_item'])
    expect(result.score).toEqual({
      total: 1,
      min: 0,
      max: 27,
      band: 'minimal',
      clusters: [],
      provisional: null,
      shaded: null,
    })
    expect(scoreQuestionnaire('phq9', [3, 3, 3, 3, 3, 3, 3, 3, 0]).flags).toEqual([])
  })

  it('never flags the PHQ-8, which has no safety item', () => {
    expect(scoreQuestionnaire('phq8', [3, 3, 3, 3, 3, 3, 3, 3]).flags).toEqual([])
  })

  it('scores the PCL-5 clusters, the DSM-5 rule and the suicide screening note', () => {
    const answers = [2, 0, 0, 0, 0, 2, 0, 2, 2, 0, 0, 0, 0, 0, 2, 2, 4, 4, 4, 4]
    const { score, flags } = scoreQuestionnaire('pcl5', answers)
    expect(score.total).toBe(28)
    expect(score.band).toBe('below_cutoff')
    expect(score.clusters).toEqual([
      { id: 'b', total: 2, max: 20, endorsed: 1, required: 1 },
      { id: 'c', total: 2, max: 8, endorsed: 1, required: 1 },
      { id: 'd', total: 4, max: 28, endorsed: 2, required: 2 },
      { id: 'e', total: 20, max: 24, endorsed: 6, required: 2 },
    ])
    expect(score.provisional).toBe(true)
    expect(flags).toEqual([])

    const high = scoreQuestionnaire('pcl5', [...Array.from({ length: 18 }, () => 2), 0, 0])
    expect(high.score.total).toBe(36)
    expect(high.score.provisional).toBe(true)
    expect(high.flags).toEqual(['suicide_screen'])

    const withoutAvoidance = scoreQuestionnaire('pcl5', [
      4,
      4,
      4,
      4,
      4,
      1,
      1,
      ...Array.from({ length: 13 }, () => 4),
    ])
    expect(withoutAvoidance.score.provisional).toBe(false)
    expect(withoutAvoidance.flags).toEqual(['suicide_screen'])
  })

  it('counts the ASRS answers in the shaded boxes next to the continuous score', () => {
    const fourShaded = scoreQuestionnaire('asrs6', [2, 2, 1, 3, 3, 2])
    expect(fourShaded.score.total).toBe(13)
    expect(fourShaded.score.band).toBe('high_negative')
    expect(fourShaded.score.shaded).toEqual({ count: 4, positive: true })

    const three = scoreQuestionnaire('asrs6', [1, 1, 2, 4, 4, 2])
    expect(three.score.shaded).toEqual({ count: 3, positive: false })
  })

  it('scores the K10 from 10 to 50 and the K6 from 0 to 24', () => {
    expect(scoreQuestionnaire('k10', answersSumming(30, 10, 5, 1)).score.band).toBe(
      'distress_very_high',
    )
    expect(
      scoreQuestionnaire(
        'k10',
        Array.from({ length: 10 }, () => 1),
      ).score.total,
    ).toBe(10)
    expect(scoreQuestionnaire('k6', answersSumming(13, 6, 4)).score.band).toBe('serious_distress')
  })

  it('refuses unanswered or out-of-scale answers', () => {
    expect(() => scoreQuestionnaire('gad7', [0, 0, 0, 0, 0, 0, null])).toThrow(
      InvalidQuestionnaireAnswerError,
    )
    expect(() =>
      scoreQuestionnaire(
        'k10',
        Array.from({ length: 10 }, () => 0),
      ),
    ).toThrow('K10 does not accept this answer')
  })

  it('versions every scoring rule per instrument', () => {
    expect(instrumentVersionOf('pcl5')).toBe('pcl5@1')
    expect(instrumentVersionOf('k6')).toBe('k6@1')
  })

  it('cites a source for every band', () => {
    for (const source of scoreSources) {
      expect(scoreSourceReferences[source].citation).not.toBe('')
      expect(scoreSourceReferences[source].url).toMatch(/^https:\/\//)
    }
  })
})
