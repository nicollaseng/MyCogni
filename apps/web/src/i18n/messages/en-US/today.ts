import type { TodayMessages } from '../pt-BR/today'

export const today: TodayMessages = {
  meta: {
    title: 'Today',
  },
  title: 'How are you feeling right now?',
  intro: 'It takes less than a minute. On a hard day, your mood alone is enough.',
  checkIn: 'Log how I feel',
  recent: {
    title: 'Last {days} days',
    emptyLabel: 'No days logged in the last {days} days',
    label: 'Mood on {count} of the last {days} days',
    emptyHint: 'Your days show up here as you log them.',
    summary: '{count} of {days} days logged.',
  },
  screeningDue:
    'It has been {count, plural, one {# day} other {# days}}. Retake the questionnaires',
}
