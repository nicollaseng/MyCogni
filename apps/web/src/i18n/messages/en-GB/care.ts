import { care as american } from '../en-US/care'
import type { CareMessages } from '../pt-BR/care'

export const care: CareMessages = {
  ...american,
  invite: {
    ...american.invite,
    closed: {
      ...american.invite.closed,
      canceled: { ...american.invite.closed.canceled, title: '{name} cancelled this invitation.' },
    },
  },
  accept: {
    ...american.accept,
    closed: {
      ...american.accept.closed,
      canceled: '{name} cancelled this invitation on {date}.',
    },
  },
  invites: {
    ...american.invites,
    groups: { ...american.invites.groups, canceled: 'Cancelled' },
    dates: { ...american.invites.dates, canceled: 'Cancelled on {date}' },
  },
  notifications: {
    ...american.notifications,
    invitationStatus: {
      ...american.notifications.invitationStatus,
      canceled: 'Invitation cancelled',
    },
  },
}
