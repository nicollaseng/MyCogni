import type { Locale } from '@mycogni/domain'

export interface ReminderCopy {
  title: string
  body: string
  action: string
  why: string
  off: string
}

const english: ReminderCopy = {
  title: 'Time for your pause',
  body: 'How about a few minutes for yourself?',
  action: 'Open Zen',
  why: 'You get this reminder because you chose a time to practice.',
  off: 'Stop email reminders',
}

export const reminderCopies: Readonly<Record<Locale, ReminderCopy>> = {
  'pt-BR': {
    title: 'Hora da sua pausa',
    body: 'Que tal alguns minutos para você?',
    action: 'Abrir o Zen',
    why: 'Você recebe este lembrete porque escolheu um horário para praticar.',
    off: 'Não quero mais lembretes por email',
  },
  'pt-PT': {
    title: 'Hora da sua pausa',
    body: 'Que tal alguns minutos para si?',
    action: 'Abrir o Zen',
    why: 'Recebe este lembrete porque escolheu uma hora para praticar.',
    off: 'Não quero mais lembretes por email',
  },
  'en-US': english,
  'en-GB': { ...english, why: 'You get this reminder because you chose a time to practise.' },
}
