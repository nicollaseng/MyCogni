import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import type { Database } from '../../db/client.ts'
import { createNotificationRepository } from './notification.repository.ts'
import { notificationRoutes } from './notification.routes.ts'
import { createNotificationService } from './notification.service.ts'

export function notificationModule(db: Database): FastifyPluginCallbackZod {
  return notificationRoutes(
    createNotificationService(createNotificationRepository(db), () => new Date()),
  )
}
