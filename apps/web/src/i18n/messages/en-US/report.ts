import type { ReportMessages } from '../pt-BR/report'

export const report: ReportMessages = {
  close: 'Close',
  cancel: 'Cancel',
  period: 'Period',
  days: 'Last {days} days',
  content: 'What goes in the file',
  reading: 'Summary of the period',
  readingHint:
    'Adds the latest summary of the period, when there is one. It is written automatically and is not a diagnosis.',
  submit: 'Download PDF',
  submitting: 'Creating the PDF…',
  error: 'We could not create the report right now. Please try again in a moment.',
  patient: {
    open: 'Export report',
    title: 'Export report',
    description:
      'A PDF with your mood day by day, what came up most in your check-ins and your questionnaires. The file is yours to keep or send to anyone you choose.',
    notes: 'Your notes',
    notesHint:
      'Left out because the file may be shared. Include them only if you want whoever receives it to read what you wrote.',
    summary:
      'The PDF will cover the last {days} days, {notes, select, true {with your notes} other {without your notes}}{reading, select, true { and with the summary, if there is one} other {}}.',
  },
  professional: {
    open: 'Download report',
    title: 'Download report',
    description:
      'A PDF with the mood, what came up most and the questionnaires of {name}, using only the check-ins you already see in the file.',
    notes: 'Their notes',
    notesHint:
      'Left out by default. Include them only if the file stays in the clinical record and is not passed on.',
    summary:
      'The PDF will cover the last {days} days, {notes, select, true {with the notes} other {without the notes}}{reading, select, true { and with the summary, if there is one} other {}}.',
  },
}
