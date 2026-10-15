import { labelsFor } from '@mycogni/domain'
import { checkIn as american } from '../en-US/check-in'
import type { CheckInMessages } from '../pt-BR/check-in'

const labels = labelsFor('en-GB')

export const checkIn: CheckInMessages = {
  ...american,
  emotions: labels.emotions,
  contexts: labels.contexts,
}
