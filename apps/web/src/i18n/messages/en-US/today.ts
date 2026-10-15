import type { TodayMessages } from '../pt-BR/today'

export const today: TodayMessages = {
  meta: {
    title: 'Today',
  },
  title: 'How are you feeling right now?',
  intro: 'It takes less than a minute. On a hard day, your mood alone is enough.',
  checkIn: 'Log how I feel',
  writeMyBook: 'Write in MyBook',
  recent: {
    title: 'Last {days} days',
    average: 'Over the last 7 days, your average mood was {average} out of 6 ({mood}).',
    change: {
      higher: 'Higher than the week before ({previous}).',
      slightlyHigher: 'A little higher than the week before ({previous}).',
      similar: 'About the same as the week before ({previous}).',
      slightlyLower: 'A little lower than the week before ({previous}).',
      lower: 'Lower than the week before ({previous}).',
    },
    noRecentWeek: 'No check-ins in the last 7 days.',
    empty: 'Your days show up here as you log them.',
    recorded: '{count} of {days} days logged.',
    chartLabel: 'Average mood of each of the last {days} days',
  },
  chart: {
    day: 'Day',
    mood: 'Average mood',
    noRecord: 'No check-in',
    records: '{count, plural, one {# check-in} other {# check-ins}}',
  },
}
