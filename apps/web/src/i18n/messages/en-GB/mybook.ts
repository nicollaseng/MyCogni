import { mybook as american } from '../en-US/mybook'
import type { MybookMessages } from '../pt-BR/mybook'

export const mybook: MybookMessages = {
  ...american,
  sharing: {
    ...american.sharing,
    flow: {
      ...american.sharing.flow,
      needDate: 'Choose a date from tomorrow onwards.',
    },
  },
}
