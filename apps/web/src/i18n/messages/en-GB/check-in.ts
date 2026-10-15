import { checkIn as american } from '../en-US/check-in'
import type { CheckInMessages } from '../pt-BR/check-in'

export const checkIn: CheckInMessages = {
  ...american,
  emotions: {
    ...american.emotions,
    tranquility: 'tranquillity',
    vigor: 'vigour',
  },
  contexts: {
    ...american.contexts,
    children: 'children',
    coworkers: 'colleagues',
  },
}
