import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import type { Database } from '../../db/client.ts'
import { createReminderRepository } from './reminder.repository.ts'
import { reminderPublicRoutes, reminderRoutes } from './reminder.routes.ts'
import { createReminderService, type ReminderService } from './reminder.service.ts'
import { createUnsubscribeTokens } from './unsubscribe-token.ts'

export interface ReminderModuleOptions {
  db: Database
  tokenSecret: string
  pushKey: string | null
}

function reminderService({ db, tokenSecret, pushKey }: ReminderModuleOptions): ReminderService {
  return createReminderService({
    repository: createReminderRepository(db),
    tokens: createUnsubscribeTokens(tokenSecret),
    pushKey,
  })
}

export function reminderModule(options: ReminderModuleOptions): FastifyPluginCallbackZod {
  return reminderRoutes(reminderService(options))
}

export function reminderPublicModule(options: ReminderModuleOptions): FastifyPluginCallbackZod {
  return reminderPublicRoutes(reminderService(options))
}
