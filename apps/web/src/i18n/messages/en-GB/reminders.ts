import { reminders as american } from '../en-US/reminders'
import type { RemindersMessages } from '../pt-BR/reminders'

export const reminders: RemindersMessages = {
  ...american,
  offer: { ...american.offer, title: 'Would you like a daily reminder to practise?' },
}
