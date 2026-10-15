import type { EntriesMessages } from '../pt-BR/entries'

export const entries: EntriesMessages = {
  meta: {
    title: 'Entries',
  },
  title: 'Entries',
  description:
    'Every check-in is kept here, with the date, your mood and anything you want to note.',
  empty: 'Your first entry will show up here.',
  emptyAction: 'Do your first check-in',
  older: 'Earlier entries',
  days: {
    today: 'Today',
    yesterday: 'Yesterday',
  },
  search: {
    label: 'Search your entries',
    placeholder: 'Search notes and emotions',
    submit: 'Search',
    clear: 'Clear search',
  },
  filters: {
    label: 'Filters',
    clear: 'Clear filters',
    period: {
      label: 'Period',
      any: 'All time',
      week: 'Last 7 days',
      month: 'Last 30 days',
      quarter: 'Last 90 days',
    },
    mood: {
      label: 'Mood',
      any: 'Any mood',
      hard: 'Hard days',
      neutral: 'Neutral mood',
      good: 'Good mood',
    },
    emotion: {
      label: 'Emotion',
      any: 'All emotions',
      used: 'Your most used',
    },
    context: {
      label: 'Context',
      any: 'All contexts',
      used: 'Your most used',
    },
    withNote: 'With a note',
  },
  results: {
    reset: 'Clear search and filters',
    all: '{count, plural, one {# entry} other {# entries}}',
    filtered: '{count, plural, =0 {No entries found} one {# entry found} other {# entries found}}',
    none: 'Nothing here for this search and these filters. Try another word or period.',
  },
}
