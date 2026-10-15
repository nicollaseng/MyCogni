import type { PatternsMessages } from '../pt-BR/patterns'

export const patterns: PatternsMessages = {
  meta: {
    title: 'Patterns',
  },
  title: 'Patterns',
  description: 'What repeats in your entries.',
  empty: 'Your patterns show up here as you record.',
  emptyAction: 'Do a check-in',
  footnote: 'Shows what happened together, not what caused what. It is not a diagnosis.',
  period: {
    label: 'Period',
    days: '{days} days',
    none: 'No entries in the last {days} days.',
  },
  summary: {
    title: 'In short',
    average: 'Average mood',
    near: 'Close to “{mood}”',
    change: 'Change',
    changeReading: {
      higher: 'Above the previous {days} days',
      slightlyHigher: 'A little above the previous {days} days',
      similar: 'Similar to the previous {days} days',
      slightlyLower: 'A little below the previous {days} days',
      lower: 'Below the previous {days} days',
    },
    recorded: 'Days with entries',
    recordedValue: '{count} of {days}',
    streak:
      '{count, plural, =0 {No streak right now} one {Current streak: # day} other {Current streak: # days}}',
  },
  chart: {
    title: 'Your mood',
    label: 'Average mood of each day in the last {days} days',
  },
  associations: {
    better: 'What comes with your better days',
    harder: 'What comes with your harder days',
    harderShort: 'And on harder days',
    title: 'What comes with your days',
    reading: 'Average mood on days with and without each context.',
    with: 'with',
    without: 'without',
    days: '{with, plural, one {# day} other {# days}} with, {without, plural, one {# day} other {# days}} without',
    similar: 'So far, no context has changed the average of your days much.',
  },
  weekdays: {
    title: 'Days of the week',
    reading: 'Best day: {best} · Hardest: {worst}',
    none: 'no entries',
    row: '{weekday}: average {average} over {count, plural, one {# day} other {# days}}',
    days: '{count, plural, one {# day} other {# days}}',
  },
  frequent: {
    title: 'Emotions and contexts',
    emotions: 'Emotions',
    contexts: 'Contexts',
    count: '{count, plural, one {# entry} other {# entries}}',
    none: 'Nothing marked yet.',
  },
  scores: {
    title: 'Questionnaires',
    latest: 'Latest: {score} of {max}, {severity}.',
    point: '{date}: {score} of {max}, {severity}',
  },
  upcoming: {
    title: 'Coming up',
    sections: {
      summary: 'Automatic summary',
      weekdays: 'Days of the week',
      frequent: 'Emotions and contexts',
      associations: 'What comes with your days',
      scores: 'Questionnaires',
    },
    progress: {
      records: '{current} of {required} entries',
      days: '{current} of {required} days',
      answers: '{current} of {required} answers',
    },
    contexts: 'Mark contexts in your entries',
    disabled: 'Off',
    enable: 'Turn on',
  },
}
