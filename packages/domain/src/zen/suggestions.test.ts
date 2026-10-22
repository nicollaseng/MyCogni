import { describe, expect, it } from '@jest/globals'
import type { InstrumentId, Severity } from '../assessments/instrument.ts'
import type { RecordSignal } from './signals.ts'
import {
  frequentAnxietyRecords,
  frequentSleepRecords,
  needsCrisisHelp,
  readArticles,
  suggestedArticles,
  zenSuggestion,
  workPressureMood,
  workPressureRecords,
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

const starting = { reasons: ['starting'], tracks: ['sleep-and-rest'] }

describe('zenSuggestion', () => {
  it('starts with sleep when nothing asks for attention', () => {
    expect(zenSuggestion(signals([result('phq9', 'mild'), result('gad7', 'mild')], 4))).toEqual(
      starting,
    )
    expect(zenSuggestion(signals([]))).toEqual(starting)
  })

  it('reads a negative short screen as the latest answer of its area', () => {
    expect(
      zenSuggestion(signals([result('phq2', 'minimal'), result('gad2', 'minimal')], 4)),
    ).toEqual(starting)
  })

  it('suggests the anxiety track for a moderate GAD-7', () => {
    expect(zenSuggestion(signals([result('gad7', 'moderate')]))).toEqual({
      reasons: ['anxiety'],
      tracks: ['everyday-anxiety'],
    })
  })

  it('suggests the low mood track for a moderate PHQ-9', () => {
    expect(zenSuggestion(signals([result('phq9', 'moderate')]))).toEqual({
      reasons: ['depression'],
      tracks: ['low-mood'],
    })
  })

  it('suggests the low mood track when recent moods average 2 or less', () => {
    expect(zenSuggestion(signals([], 2))).toEqual({
      reasons: ['low_mood'],
      tracks: ['low-mood'],
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
  })

  it('puts seeking help first whenever PHQ-9 item 9 was answered above zero', () => {
    expect(
      zenSuggestion(signals([result('phq9', 'minimal', true), result('gad7', 'moderate')])),
    ).toEqual({
      reasons: ['risk_item', 'anxiety'],
      tracks: ['seeking-help', 'everyday-anxiety'],
    })
  })

  it('lists each track once, in the order of the rules', () => {
    expect(
      zenSuggestion(signals([result('phq9', 'moderate'), result('gad7', 'moderate')], 1.5)),
    ).toEqual({
      reasons: ['anxiety', 'depression', 'low_mood'],
      tracks: ['everyday-anxiety', 'low-mood'],
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

describe('needsCrisisHelp', () => {
  it('offers crisis help only after a risk answer, not for a severe result alone', () => {
    expect(
      needsCrisisHelp(
        zenSuggestion({
          latest: [{ instrument: 'phq9', severity: 'mild', hasRiskFlag: true }],
          moodAverage: null,
        }),
      ),
    ).toBe(true)
    expect(
      needsCrisisHelp(
        zenSuggestion({
          latest: [{ instrument: 'gad7', severity: 'severe', hasRiskFlag: false }],
          moodAverage: null,
        }),
      ),
    ).toBe(false)
    expect(needsCrisisHelp(zenSuggestion({ latest: [], moodAverage: null }))).toBe(false)
  })
})

function record(contexts: string[], moodLevel = 3, emotions: string[] = []): RecordSignal {
  return { moodLevel, emotions, contexts }
}

function times(count: number, make: () => RecordSignal): RecordSignal[] {
  return Array.from({ length: count }, make)
}

describe('record rules', () => {
  it('suggests sleep when sleep appears in 3 records, not 2', () => {
    expect(frequentSleepRecords).toBe(3)
    expect(
      zenSuggestion({ latest: [], moodAverage: null, records: times(3, () => record(['sleep'])) }),
    ).toEqual({ reasons: ['frequent_sleep'], tracks: ['sleep-and-rest'] })
    expect(
      zenSuggestion({ latest: [], moodAverage: null, records: times(2, () => record(['sleep'])) }),
    ).toEqual(starting)
  })

  it('suggests pressure and performance after 2 hard days with work or studies', () => {
    expect(workPressureRecords).toBe(2)
    expect(workPressureMood).toBe(2)
    expect(
      zenSuggestion({
        latest: [],
        moodAverage: null,
        records: [record(['work'], 2), record(['studies', 'home'], 0)],
      }),
    ).toEqual({ reasons: ['work_pressure'], tracks: ['performance-anxiety'] })
    expect(
      zenSuggestion({
        latest: [],
        moodAverage: null,
        records: [record(['work'], 2), record(['work'], 3), record(['family'], 0)],
      }),
    ).toEqual(starting)
  })

  it('suggests the anxiety track when the anxiety emotion appears in 3 records', () => {
    expect(frequentAnxietyRecords).toBe(3)
    expect(
      zenSuggestion({
        latest: [],
        moodAverage: null,
        records: times(3, () => record([], 3, ['anxiety'])),
      }),
    ).toEqual({ reasons: ['frequent_anxiety'], tracks: ['everyday-anxiety'] })
    expect(
      zenSuggestion({
        latest: [],
        moodAverage: null,
        records: [...times(2, () => record([], 3, ['anxiety'])), record([], 3, ['worry'])],
      }),
    ).toEqual(starting)
  })

  it('puts questionnaires first, then the mood average, then the records, once per track', () => {
    expect(
      zenSuggestion({
        latest: [result('gad7', 'moderate')],
        moodAverage: 1.5,
        records: [
          ...times(3, () => record(['sleep'], 1, ['anxiety'])),
          ...times(2, () => record(['work'], 1)),
        ],
      }),
    ).toEqual({
      reasons: ['anxiety', 'low_mood', 'frequent_sleep', 'work_pressure', 'frequent_anxiety'],
      tracks: ['everyday-anxiety', 'low-mood', 'sleep-and-rest', 'performance-anxiety'],
    })
  })
})

describe('night', () => {
  it('moves sleep to the front at night and says why', () => {
    expect(
      zenSuggestion({ latest: [result('gad7', 'moderate')], moodAverage: null, night: true }),
    ).toEqual({
      reasons: ['anxiety', 'night'],
      tracks: ['sleep-and-rest', 'everyday-anxiety'],
    })
    expect(
      zenSuggestion({
        latest: [],
        moodAverage: null,
        records: times(3, () => record(['sleep'])),
        night: true,
      }),
    ).toEqual({ reasons: ['frequent_sleep', 'night'], tracks: ['sleep-and-rest'] })
    expect(zenSuggestion({ latest: [], moodAverage: null, night: true })).toEqual({
      reasons: ['starting', 'night'],
      tracks: ['sleep-and-rest'],
    })
  })

  it('never lets the night pass in front of a safety reason', () => {
    expect(
      zenSuggestion({ latest: [result('phq9', 'mild', true)], moodAverage: null, night: true }),
    ).toEqual({ reasons: ['risk_item'], tracks: ['seeking-help'] })
    expect(
      zenSuggestion({ latest: [result('gad7', 'severe')], moodAverage: null, night: true }),
    ).toEqual({
      reasons: ['severe_result', 'anxiety'],
      tracks: ['seeking-help', 'everyday-anxiety'],
    })
    expect(zenSuggestion({ latest: [], moodAverage: null, night: false })).toEqual(starting)
  })
})
