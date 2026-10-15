import type { MarkNotificationsReadInput, NotificationList } from '@mycogni/contracts'
import { effectiveStatus } from '@mycogni/domain'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import type { NotificationRepository } from './notification.repository.ts'

export interface NotificationService {
  list(user: AuthenticatedUser): Promise<NotificationList>
  markRead(user: AuthenticatedUser, input: MarkNotificationsReadInput): Promise<void>
}

const pageSize = 50

export function createNotificationService(
  repository: NotificationRepository,
  now: () => Date,
): NotificationService {
  return {
    async list(user) {
      const [records, unread] = await Promise.all([
        repository.list(user.id, pageSize),
        repository.unread(user.id),
      ])
      return {
        unread,
        items: records.map(({ invitation, createdAt, readAt, ...record }) => ({
          ...record,
          createdAt: createdAt.toISOString(),
          readAt: readAt?.toISOString() ?? null,
          invitation:
            invitation === null
              ? null
              : {
                  id: invitation.id,
                  status: effectiveStatus(invitation, now()),
                  professional: {
                    name: invitation.professionalName,
                    kind: invitation.professionalKind,
                  },
                },
        })),
      }
    },
    markRead(user, input) {
      return repository.markRead(user.id, input.ids)
    },
  }
}
