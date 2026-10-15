import type { InsightsMessages } from '../pt-BR/insights'

export const insights: InsightsMessages = {
  patient: {
    title: 'Summary of your entries',
    period: '{period} · {count, plural, one {# entry} other {# entries}}',
    records: '{count, plural, one {# entry} other {# entries}}',
    highlights: 'What stood out',
    suggestions: 'For the coming days',
    disclaimer: 'Written automatically from your entries. It is not a diagnosis.',
    earlier: 'Earlier summaries',
    empty: {
      explanation:
        'Every {threshold} entries, a short summary of what stood out in your days appears here, with a few suggestions. It is written automatically from your entries and is not a diagnosis.',
      progress: '{count} of {threshold} entries toward the first summary',
      disabled: 'Summaries are turned off for your account.',
      enable: 'Turn them on in your profile',
    },
  },
  teaser: {
    title: 'Your latest summary',
    open: 'Read the full summary',
  },
  professional: {
    title: 'Summaries',
    note: 'Written automatically from the entries shared with you, without MyBook. They are not a diagnosis.',
    empty:
      'No summaries for this patient yet. A summary is written every {threshold} entries, if the person turned summaries on in their account.',
    period: '{period} · {count, plural, one {# entry} other {# entries}}',
    attention: {
      none: 'No signs needing attention',
      watch: 'Watch',
      urgent: 'Urgent',
    },
    records: '{count, plural, one {# entry} other {# entries}}',
    trends: 'Trends',
    themes: 'Themes',
    nothing: 'Nothing to note.',
    earlier: 'Earlier summaries',
    columns: {
      period: 'Period',
      attention: 'Attention',
      records: 'Entries',
    },
  },
}
