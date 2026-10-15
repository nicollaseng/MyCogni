import type { AdminMessages } from '../pt-BR/admin'

export const admin: AdminMessages = {
  shell: {
    team: 'MyCogniAI team',
  },
  professionals: {
    title: 'Professionals',
    description:
      'Check the name and the license before approving. Only verified professionals can invite patients.',
    tabs: {
      label: 'Sign-up status',
      pending: 'Waiting',
      verified: 'Verified',
      rejected: 'Rejected',
    },
    columns: {
      name: 'Name',
      kind: 'Profession',
      registration: 'License',
      email: 'Email',
      createdAt: 'Signed up',
      actions: 'Actions',
    },
    empty: {
      pending: 'No sign-ups waiting for verification.',
      verified: 'No verified professionals yet.',
      rejected: 'No rejected sign-ups.',
    },
    kind: 'Profession',
    registration: 'License',
    noRegistration: 'No license',
    email: 'Email',
    noEmail: 'No email',
    createdAt: 'Signed up {date}',
    reviewedAt: 'Reviewed {date}',
    approve: 'Approve',
    reject: 'Reject',
    approved: '{name} approved.',
    rejected: '{name} rejected.',
    error: 'We could not save the review right now. Try again in a moment.',
  },
}
