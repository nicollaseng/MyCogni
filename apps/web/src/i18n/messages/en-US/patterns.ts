import type { PatternsMessages } from '../pt-BR/patterns'

export const patterns: PatternsMessages = {
  meta: {
    title: 'Patterns',
  },
  title: 'Patterns',
  description:
    'What repeats in your check-ins over the last 90 days. It shows what happened, without explaining causes or making a diagnosis.',
  empty: 'Your patterns show up here after your first check-ins.',
  emptyAction: 'Do a check-in',
  consistency: {
    title: 'Consistency',
    recorded: 'Days with a check-in in the last {days} days',
    recordedValue: '{count} of {days}',
    streak: 'Current streak',
    streakValue: '{count, plural, =0 {No days} one {# day} other {# days}}',
    stripLabel: '{count} of {days} days with a check-in',
  },
  weekdays: {
    title: 'Mood by day of the week',
    note: 'Average mood for each day of the week, from 0 (very bad) to 6 (very good).',
    missing:
      'After {minimum} days of check-ins, you will see how each day of the week tends to go. {count, plural, one {# day to go} other {# days to go}}.',
    none: 'no check-ins',
    row: '{weekday}: average {average} over {count, plural, one {# day} other {# days}}',
    days: '{count, plural, one {# day} other {# days}}',
  },
  frequent: {
    title: 'What comes up most',
    emotions: 'Emotions',
    contexts: 'Contexts',
    count: '{count, plural, one {# check-in} other {# check-ins}}',
    none: 'Nothing logged yet.',
    missing: 'After {minimum} check-ins, you will see your most frequent emotions and contexts.',
  },
  contexts: {
    title: 'Contexts and your days',
    sentence: 'On days with {context}, your average mood was {with}; without it, {without}.',
    days: '{with, plural, one {# day} other {# days}} with, {without, plural, one {# day} other {# days}} without',
    with: 'Days with the context',
    without: 'Days without the context',
    note: 'This shows what happened on the same days, not what caused what.',
    missing:
      'Not enough to compare yet. A context needs to show up on at least {days} days and be missing on another {days}.',
    similar: 'So far, no context has changed the average of your days much.',
  },
  scores: {
    title: 'Questionnaires over time',
    latest: 'Latest: {score} of {max}, {severity}.',
    single: 'Answer again to see how it changes.',
    empty: 'You have not answered the questionnaires yet.',
    note: 'The bands show how strong the signs are, from mildest (bottom) to strongest (top). They are not a diagnosis.',
    point: '{date}: {score} of {max}, {severity}',
  },
}
