import type { Notification } from '@mycogni/contracts'
import type { Route } from 'next'

export type NotificationHref = Route | `/invites/${string}` | `/support/${string}`

const feed: Route = '/notifications'

export function notificationHref({
  kind,
  invitation,
  insightId,
  supportTicket,
}: Notification): NotificationHref {
  switch (kind) {
    case 'invitation':
      return invitation === null ? feed : `/invites/${invitation.id}`
    case 'professional':
      return '/me/professionals'
    case 'insight':
      return insightId === null ? feed : `/patterns#reading-${insightId}`
    case 'support':
      return supportTicket === null ? feed : `/support/${supportTicket.id}`
    case 'reminder':
      return '/zen'
    case 'system':
    case 'marketing':
      return feed
  }
}
