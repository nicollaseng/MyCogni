import { labelsFor } from '@mycogni/domain'
import type { ScreeningMessages } from '../pt-BR/screening'

const labels = labelsFor('en-US')

export const screening: ScreeningMessages = {
  title: 'Questionnaires',
  topics: labels.instruments,
  severity: labels.severities,
  guidance: {
    minimal: 'Nothing that needs attention right now. Keep noticing how your days go.',
    mild: 'It’s worth watching how this changes over the next few weeks.',
    moderate: 'It’s worth talking to a health professional about how you’ve been feeling.',
    moderately_severe: 'We recommend talking to a health professional soon.',
    severe: 'We recommend seeing a health professional as soon as you can.',
  },
  plain: {
    title: 'Mood and anxiety',
    names: labels.plainNames,
    levels: labels.plainLevels,
    trend: {
      same: 'Same as last time',
      better: 'Better than last time',
      higher: 'Higher than last time',
    },
    level: '{name}: {level}',
  },
  questionnaire: {
    back: 'Back',
    progress: '{name} · {current} of {total}',
    saving: 'Saving your answers…',
    retry: 'Try again',
  },
  results: {
    risk: 'If you think about hurting yourself again, call:',
  },
  support: {
    title: 'Thank you for telling us.',
    body: 'You said that over the last two weeks you have thought about hurting yourself or that you would be better off dead. This is serious, and you don’t have to go through it without help.',
    danger: 'In danger right now? Go to the nearest emergency room.',
    call: 'Call 988',
    continue: 'Continue the questionnaire',
  },
  retake: {
    close: 'Close',
    title: 'How have the last two weeks been?',
    firstTime: 'There are 16 questions about mood and anxiety, one per screen.',
    since: 'Last time you answered on {date}. At the end, you’ll see what has changed since then.',
    honest: 'There are no right answers. Answer based on how things have really been.',
    start: 'Start',
    resultsTitle: 'Your results for today.',
    disclaimer:
      'This is a screening, not a diagnosis. Only a professional can assess your situation.',
    back: 'Back to profile',
    zen: 'See suggestions in Zen Space',
  },
  latest: {
    title: 'Mood and anxiety',
    empty: 'You haven’t answered the questionnaires yet.',
    answeredOn: 'Answered on {date}. This is a screening, not a diagnosis.',
    retake: 'Retake the questionnaires',
    next: 'We suggest answering again from {date}, to see how you change.',
    due: 'It has been {count, plural, one {# day} other {# days}} since your last answers. You can answer again now.',
  },
  history: {
    title: 'History',
    day: 'Day',
  },
  errors: {
    save: 'We couldn’t save your answers right now. Please try again in a moment.',
  },
}
