import type { PushSubscriptionInput, ReminderOverview, ReminderSettings } from '@mycogni/contracts'
import { reminderDefaults } from '@mycogni/domain'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import { UnprocessableError } from '../../shared/errors.ts'
import type { ReminderRepository } from './reminder.repository.ts'
import type { UnsubscribeTokens } from './unsubscribe-token.ts'

export interface ReminderService {
  overview(user: AuthenticatedUser): Promise<ReminderOverview>
  save(user: AuthenticatedUser, settings: ReminderSettings): Promise<ReminderOverview>
  subscribe(user: AuthenticatedUser, input: PushSubscriptionInput): Promise<void>
  unsubscribe(user: AuthenticatedUser, endpoint: string): Promise<void>
  emailOff(token: string): Promise<void>
}

interface ReminderDependencies {
  repository: ReminderRepository
  tokens: UnsubscribeTokens
  pushKey: string | null
}

export function createReminderService({
  repository,
  tokens,
  pushKey,
}: ReminderDependencies): ReminderService {
  async function overview(user: AuthenticatedUser): Promise<ReminderOverview> {
    const [settings, devices] = await Promise.all([
      repository.settings(user.id),
      repository.devices(user.id),
    ])
    return {
      settings: settings ?? { ...reminderDefaults, days: [...reminderDefaults.days] },
      pushKey,
      devices,
    }
  }

  return {
    overview,
    async save(user, settings) {
      await repository.save(user.id, settings)
      return overview(user)
    },
    async subscribe(user, input) {
      await repository.claimDevice(user.id, input)
    },
    async unsubscribe(user, endpoint) {
      await repository.removeDevice(user.id, endpoint)
    },
    async emailOff(token) {
      const userId = tokens.verify(token)
      if (userId === null) {
        throw new UnprocessableError('This link is not valid')
      }
      await repository.turnEmailOff(userId)
    },
  }
}
