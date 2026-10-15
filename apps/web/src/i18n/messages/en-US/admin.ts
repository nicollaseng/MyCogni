import type { AdminMessages } from '../pt-BR/admin'

export const admin: AdminMessages = {
  shell: {
    team: 'MyCogniAI team',
  },
  professionals: {
    title: 'Professionals',
    description:
      'Open the document and check the name and the license before approving. Only verified professionals can invite patients.',
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
      document: 'Document',
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
    document: {
      open: 'Open',
      openLabel: 'Open the document of {name} in a new tab',
      missing: 'Waiting for upload',
    },
    rejectForm: {
      label: 'Reason for rejecting {name}',
      hint: 'The professional reads this note. Say what needs to be fixed.',
      confirm: 'Confirm rejection',
      cancel: 'Cancel',
      required: 'Write the reason, with at least 3 characters.',
    },
    note: 'Reason: {note}',
    approve: 'Approve',
    reject: 'Reject',
    approved: '{name} approved.',
    rejected: '{name} rejected.',
    error: 'We could not save the review right now. Try again in a moment.',
  },
}
