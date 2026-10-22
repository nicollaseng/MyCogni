import type { Notification } from '@mycogni/contracts'
import type { Route } from 'next'

export type NotificationHref =
  | Route
  | `/invites/${string}`
  | `/support/${string}`
  | `/questionnaires/${string}`
  | `/pro/patients/${string}/questionnaires/${string}`

const feed: Route = '/notifications'

export function notificationHref({
  kind,
  invitation,
  insightId,
  supportTicket,
  questionnaire,
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
    case 'questionnaire_assigned':
      return questionnaire === null ? feed : `/questionnaires/${questionnaire.assignmentId}`
    case 'questionnaire_completed':
      return questionnaire === null
        ? '/pro'
        : `/pro/patients/${questionnaire.patientId}/questionnaires/${questionnaire.assignmentId}`
    case 'export_ready':
    case 'export_failed':
      return '/me/privacy#data'
    case 'system':
    case 'marketing':
      return feed
  }
}
