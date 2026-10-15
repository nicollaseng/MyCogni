import { legal as american } from '../en-US/legal'
import type { LegalMessages } from '../pt-BR/legal'

export const legal: LegalMessages = {
  ...american,
  terms: {
    ...american.terms,
    sections: {
      ...american.terms.sections,
      crisis: {
        ...american.terms.sections.crisis,
        body: 'MyCogniAI is not an emergency service. If you are in crisis or thinking about hurting yourself, call Samaritans on 116\u00a0123 or call 999.',
      },
    },
  },
}
