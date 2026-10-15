import { professional as american } from '../en-US/professional'
import type { ProfessionalMessages } from '../pt-BR/professional'

export const professional: ProfessionalMessages = {
  ...american,
  form: {
    ...american.form,
    lead: 'Once you send them, our team checks your registration before enabling invitations.',
    registration: 'Registration number',
    registrationHints: {
      ...american.form.registrationHints,
      psychologist: 'E.g. HCPC PYL12345',
      psychiatrist: 'E.g. GMC 1234567',
      physician: 'E.g. GMC 1234567',
    },
    errors: {
      ...american.form.errors,
      registrationRequired: 'Enter your registration number.',
    },
  },
  status: {
    pending: {
      ...american.status.pending,
      body: 'Our team checks your professional registration by hand before enabling invitations.',
      steps: {
        ...american.status.pending.steps,
        review: 'We check your name and your registration.',
      },
    },
    rejected: {
      ...american.status.rejected,
      body: 'If you think this is a mistake or want to send other details, write to <link>{email}</link> with your name and registration number.',
    },
  },
  invites: {
    ...american.invites,
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
