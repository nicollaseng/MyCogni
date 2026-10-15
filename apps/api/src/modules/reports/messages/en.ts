import { pluralizer } from './plural.ts'
import type { ReportMessages } from './pt-br.ts'

const plural = pluralizer('en-US')

export const english: ReportMessages = {
  fileStem: 'mycogni-report',
  title: 'Mood report',
  lastDays: (days) => `Last ${String(days)} days`,
  generatedOn: (date) => `Generated on ${date}`,
  unnamed: 'Person without a name on file',
  kpis: {
    recorded: 'Days with a check-in',
    recordedValue: (count, days) => `${String(count)} of ${String(days)}`,
    recordedDetail: (count) =>
      plural(count, { one: '# check-in in the period', other: '# check-ins in the period' }),
    average: 'Average mood',
    averageValue: (value) => `${value} of 6`,
    noAverage: 'No check-ins in the period',
    change: (days) => `Compared with the ${String(days)} days before`,
    changes: {
      higher: 'Higher',
      slightlyHigher: 'A little higher',
      similar: 'Similar',
      slightlyLower: 'A little lower',
      lower: 'Lower',
    },
    previous: (average) => `Previous average: ${average}`,
    noComparison: 'Too few days with check-ins to compare',
  },
  chart: {
    title: 'Mood by day',
    caption:
      'Average for each day, from 0 (very bad) to 6 (very good). Days without a dot have no check-in.',
    empty: 'No check-ins in this period.',
  },
  frequent: {
    title: 'What came up most',
    emotions: 'Emotions',
    contexts: 'Contexts',
    count: (count) => plural(count, { one: '# check-in', other: '# check-ins' }),
    empty: 'Nothing logged in this period.',
  },
  screenings: {
    title: 'Questionnaires',
    note: 'Latest result of each questionnaire in the period. This is a screening, not a diagnosis.',
    score: (score, max) => `${String(score)} of ${String(max)}`,
    answeredOn: (date) => `Answered on ${date}`,
    risk: (date) =>
      `Item 9 (thoughts of death or self-harm) answered above zero on ${date}. Assess the risk.`,
    empty: 'No questionnaire answered in this period.',
  },
  reading: {
    title: 'Summary of the period',
    patientNotice: 'Written automatically from the check-ins. It is not a diagnosis.',
    professionalNotice:
      'Written automatically from the check-ins shared with you, without MyBook. It is not a diagnosis.',
    covers: (period) => `Covers the check-ins from ${period}`,
    highlights: 'What stood out',
    suggestions: 'For the coming days',
    trends: 'Trends',
    themes: 'Themes',
    attention: (level, reason) =>
      reason === null ? `Attention: ${level}.` : `Attention: ${level}. ${reason}`,
    attentionLevels: {
      watch: 'watch',
      urgent: 'urgent',
    },
  },
  notes: {
    title: 'Notes',
    empty: 'No notes in this period.',
  },
  footer: {
    disclaimer:
      'This report is not a diagnosis and does not replace care from a health professional.',
    crisis: 'In a crisis, call',
    page: (page, total) => `${String(page)} of ${String(total)}`,
  },
}
