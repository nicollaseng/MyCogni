import { landing as american } from '../en-US/landing'
import type { LandingMessages } from '../pt-BR/landing'

export const landing: LandingMessages = {
  ...american,
  ai: {
    ...american.ai,
    principles: {
      ...american.ai.principles,
      crisis:
        'If a sign of risk appears, it shows human help straight away: Samaritans on 116 123.',
    },
  },
  weeklyNote: {
    ...american.weeklyNote,
    caption: 'weekly summary · 5–11 October',
  },
  faq: {
    ...american.faq,
    questions: {
      ...american.faq.questions,
      instruments: {
        ...american.faq.questions.instruments,
        answer:
          'They are short, validated questionnaires used in the UK and around the world to screen for signs of depression (PHQ-9) and anxiety (GAD-7). They show intensity; they do not give a diagnosis.',
      },
      crisis: {
        ...american.faq.questions.crisis,
        answer:
          'Call Samaritans on 116\u00a0123, free and open 24/7, or call 999 in an emergency. The "Need help right now?" link is on every screen of the app.',
      },
    },
  },
  footer: {
    ...american.footer,
    disclaimer: 'Not therapy or a diagnosis. In a crisis, call Samaritans on 116\u00a0123.',
  },
}
