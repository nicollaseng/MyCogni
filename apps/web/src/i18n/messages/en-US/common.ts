import { labelsFor } from '@mycogni/domain'
import type { CommonMessages } from '../pt-BR/common'

export const common: CommonMessages = {
  meta: {
    description:
      'A mood journal: one check-in a day, plus questions about mood and anxiety every two weeks, to see how you change.',
  },
  navigation: {
    label: 'Main navigation',
    today: 'Today',
    entries: 'Entries',
    mybook: 'MyBook',
    patterns: 'Patterns',
    zen: 'Zen',
  },
  account: {
    open: 'Your account',
    menu: 'Account',
    profile: 'Profile and settings',
    professionals: 'Professionals',
    support: 'Support',
    signOut: 'Sign out',
  },
  help: {
    summary: 'Need help right now?',
    intro: 'If you are in crisis or thinking about hurting yourself, call now:',
    disclaimer: 'MyCogniAI does not replace care from a professional.',
  },
  whatsapp: {
    list: 'WhatsApp of the people who support you',
    talk: 'Message {name} now',
    label: 'WhatsApp',
    message:
      'Hi {name}, this is urgent. I need help right now.\n\nMessage sent through the MyCogniAI app',
  },
  loading: 'Loading',
  notFound: {
    title: 'This page does not exist.',
    body: 'The address may have changed or be incomplete.',
    back: 'Back to the start',
  },
  mood: {
    ...labelsFor('en-US').moods,
    scaleLow: 'very bad',
    scaleHigh: 'very good',
  },
  professionalKinds: {
    psychologist: 'Psychology',
    psychiatrist: 'Psychiatry',
    physician: 'Medicine',
    psychoanalyst: 'Psychoanalysis',
  },
  photoOf: 'Photo of {name}',
  language: {
    label: 'Language',
    hint: 'The app switches to this language on every screen.',
  },
  outdated: {
    message: 'The app was updated. Reload to continue.',
    reload: 'Reload',
  },
}
