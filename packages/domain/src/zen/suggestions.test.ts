import { describe, expect, it } from '@jest/globals'
import type { InstrumentId, Severity } from '../assessments/instrument.ts'
import {
  readArticles,
  suggestedArticles,
  zenSuggestion,
  type ScreeningSignal,
  type ZenSignals,
} from './suggestions.ts'

function result(
  instrument: InstrumentId,
  severity: Severity,
  hasRiskFlag = false,
): ScreeningSignal {
  return { instrument, severity, hasRiskFlag }
}

function signals(latest: ScreeningSignal[], moodAverage: number | null = null): ZenSignals {
  return { latest, moodAverage }
}

const starting = { reasons: ['starting'], tracks: ['sleep-and-rest'], seekHelpFirst: false }

describe('zenSuggestion', () => {
  it('starts with sleep when nothing asks for attention', () => {
    expect(zenSuggestion(signals([result('phq9', 'mild'), result('gad7', 'mild')], 4))).toEqual(
      starting,
    )
    expect(zenSuggestion(signals([]))).toEqual(starting)
  })

  it('suggests the anxiety track for a moderate GAD-7', () => {
    expect(zenSuggestion(signals([result('gad7', 'moderate')]))).toEqual({
      reasons: ['anxiety'],
      tracks: ['everyday-anxiety'],
      seekHelpFirst: false,
    })
  })

  it('suggests the low mood track for a moderate PHQ-9', () => {
    expect(zenSuggestion(signals([result('phq9', 'moderate')]))).toEqual({
      reasons: ['depression'],
      tracks: ['low-mood'],
      seekHelpFirst: false,
    })
  })

  it('suggests the low mood track when recent moods average 2 or less', () => {
    expect(zenSuggestion(signals([], 2))).toEqual({
      reasons: ['low_mood'],
      tracks: ['low-mood'],
      seekHelpFirst: false,
    })
    expect(zenSuggestion(signals([], 2.1))).toEqual(starting)
  })

  it.each([
    ['PHQ-9', result('phq9', 'moderately_severe'), ['seeking-help', 'low-mood']],
    ['PHQ-9', result('phq9', 'severe'), ['seeking-help', 'low-mood']],
    ['GAD-7', result('gad7', 'severe'), ['seeking-help', 'everyday-anxiety']],
  ])('puts seeking help first after a severe %s', (_, severe, tracks) => {
    const suggestion = zenSuggestion(signals([severe]))

    expect(suggestion.reasons[0]).toBe('severe_result')
    expect(suggestion.tracks).toEqual(tracks)
    expect(suggestion.seekHelpFirst).toBe(true)
  })

  it('puts seeking help first whenever PHQ-9 item 9 was answered above zero', () => {
    expect(
      zenSuggestion(signals([result('phq9', 'minimal', true), result('gad7', 'moderate')])),
    ).toEqual({
      reasons: ['risk_item', 'anxiety'],
      tracks: ['seeking-help', 'everyday-anxiety'],
      seekHelpFirst: true,
    })
  })

  it('lists each track once, in the order of the rules', () => {
    expect(
      zenSuggestion(signals([result('phq9', 'moderate'), result('gad7', 'moderate')], 1.5)),
    ).toEqual({
      reasons: ['anxiety', 'depression', 'low_mood'],
      tracks: ['everyday-anxiety', 'low-mood'],
      seekHelpFirst: false,
    })
  })
})

describe('suggestedArticles', () => {
  it('picks the unread articles of the suggested tracks, in order', () => {
    expect(suggestedArticles(['everyday-anxiety', 'sleep-and-rest'], [], 3)).toEqual([
      'anxiety-basics',
      'worry-time',
      'sleep-and-mood',
    ])
  })

  it('skips articles already read in any track', () => {
    const done = [{ trackId: 'sleep-and-rest' as const, stepId: 'read-worry-time' }]

    expect(readArticles(done)).toEqual(['worry-time'])
    expect(suggestedArticles(['everyday-anxiety'], done, 2)).toEqual(['anxiety-basics'])
    expect(
      readArticles([
        { trackId: 'sleep-and-rest', stepId: 'breathe' },
        { trackId: 'sleep-and-rest', stepId: 'gone' },
      ]),
    ).toEqual([])
  })
})
