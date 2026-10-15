import { screening as american } from '../en-US/screening'
import type { ScreeningMessages } from '../pt-BR/screening'

export const screening: ScreeningMessages = {
  ...american,
  support: {
    ...american.support,
    danger: 'In danger right now? Go to your nearest A&E.',
    call: 'Call Samaritans',
  },
}
