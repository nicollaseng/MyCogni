import type { RemindersMessages } from '../pt-BR/reminders'

export const reminders: RemindersMessages = {
  meta: { title: 'Reminders' },
  lead: 'A gentle nudge at the time you choose, for a pause.',
  enabled: {
    label: 'Practice reminder',
    hint: 'At most one a day.',
  },
  time: 'Time',
  days: {
    legend: 'Days',
    short: { sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat' },
    long: {
      sun: 'Sunday',
      mon: 'Monday',
      tue: 'Tuesday',
      wed: 'Wednesday',
      thu: 'Thursday',
      fri: 'Friday',
      sat: 'Saturday',
    },
  },
  channels: {
    legend: 'How to remind you',
    push: 'Notification on this device',
    email: 'Email',
  },
  push: {
    install:
      'On iPhone, notifications arrive when the app is on your Home Screen: tap Share, then Add to Home Screen.',
    blocked: 'Notifications are blocked in this browser. Allow them in the site settings.',
    unsupported: 'This browser can’t receive notifications. Email still works.',
    unavailable: 'Notifications aren’t available yet. Email still works.',
  },
  save: 'Save',
  saved: 'Reminder saved.',
  error: 'We couldn’t save right now. Try again in a moment.',
  offer: {
    title: 'Would you like a daily reminder to practice?',
    time: 'Reminder time',
    accept: 'Remind me daily',
    later: 'Not now',
    done: 'Done. We’ll remind you at {time}.',
    settings: 'Adjust reminders',
  },
  emailOff: {
    meta: { title: 'Email reminders' },
    title: 'Email reminders turned off',
    body: 'You won’t get reminders by email anymore. You can turn them back on whenever you like.',
    invalidTitle: 'This link didn’t work',
    invalidBody: 'You can turn reminders off in Profile and settings → Reminders.',
    settings: 'Open reminders',
  },
}
