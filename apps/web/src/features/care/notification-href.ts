import type { Notification } from '@mycogni/contracts'
import type { Route } from 'next'

export type NotificationHref = Route | `/invites/${string}`

const feed: Route = '/notifications'

export function notificationHref({ kind, invitation, insightId }: Notification): NotificationHref {
  switch (kind) {
    case 'invitation':
      return invitation === null ? feed : `/invites/${invitation.id}`
    case 'professional':
      return '/me#professionals'
    case 'insight':
      return insightId === null ? feed : `/patterns#reading-${insightId}`
    case 'system':
    case 'marketing':
      return feed
  }
}
