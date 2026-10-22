import type { JobScheduler } from '../../jobs/scheduler.ts'
import type { AssistantService } from '../assistant/assistant.service.ts'

export function rememberConversations(
  service: AssistantService,
  jobs: Pick<JobScheduler, 'memorySourceSaved'>,
): AssistantService {
  return {
    ...service,
    async send(user, scope, input) {
      const exchange = await service.send(user, scope, input)
      if (scope.mode === 'personal') {
        await jobs.memorySourceSaved(user.id)
      }
      return exchange
    },
  }
}
