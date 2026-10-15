import { markNotificationsReadSchema, notificationListSchema } from '@mycogni/contracts'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { currentUser } from '../../plugins/authentication.ts'
import type { NotificationService } from './notification.service.ts'

export function notificationRoutes(service: NotificationService): FastifyPluginCallbackZod {
  return (app, _options, done) => {
    app.get(
      '/notifications',
      { schema: { response: { 200: notificationListSchema } } },
      (request) => service.list(currentUser(request)),
    )
    app.post(
      '/notifications/read',
      { schema: { body: markNotificationsReadSchema } },
      async (request, reply) => {
        await service.markRead(currentUser(request), request.body)
        return reply.status(204).send()
      },
    )
    done()
  }
}
