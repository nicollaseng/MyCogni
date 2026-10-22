import { professional as american } from '../en-US/professional'
import type { ProfessionalMessages } from '../pt-BR/professional'

export const professional: ProfessionalMessages = {
  ...american,
  join: {
    ...american.join,
    hero: {
      ...american.join.hero,
      kicker: 'For psychologists, psychiatrists and doctors',
      points: {
        ...american.join.hero.points,
        law: 'Health data is handled with explicit consent, in line with UK GDPR.',
      },
    },
    features: {
      ...american.join.features,
      title: 'What happens between sessions, organised for the next one.',
    },
    privacy: {
      ...american.join.privacy,
      items: {
        ...american.join.privacy.items,
        law: {
          title: 'Data protection',
          body: 'Health data is handled with explicit consent, in line with UK GDPR.',
        },
      },
    },
    steps: {
      ...american.join.steps,
      signUp: {
        title: 'Sign up and verification',
        body: 'You tell us your profession and registration. Our team checks them before enabling invitations.',
      },
    },
    faq: {
      ...american.join.faq,
      questions: {
        ...american.join.faq.questions,
        who: {
          question: 'Who can sign up?',
          answer:
            'Psychologists, psychiatrists, doctors and psychoanalysts. We ask for a registration number when the profession requires one.',
        },
        diagnosis: {
          question: 'Do the questionnaires and summaries give a diagnosis?',
          answer:
            'No. PHQ-9 and GAD-7 show how intense the signs are, and summaries organise the entries. The clinical assessment is yours.',
        },
      },
    },
  },
  form: {
    ...american.form,
    lead: 'Once you send them, our team checks your registration before enabling invitations.',
  },
  status: {
    pending: {
      ...american.status.pending,
      body: 'Our team checks your professional registration by hand before enabling invitations.',
      steps: {
        ...american.status.pending.steps,
        review: 'We check your name, your registration, your photo and the document you sent.',
      },
    },
    rejected: {
      ...american.status.rejected,
      body: 'If you think this is a mistake or want to send other details, write to <link>{email}</link> with your name and registration number.',
    },
  },
  invites: {
    ...american.invites,
    filters: {
      ...american.invites.filters,
      canceled: 'Cancelled',
    },
    sent: {
      ...american.invites.sent,
      canceled: 'Invitation cancelled.',
    },
    statuses: {
      ...american.invites.statuses,
      canceled: 'Cancelled',
    },
  },
}
