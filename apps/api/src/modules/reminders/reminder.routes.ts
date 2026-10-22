import {
  pushSubscriptionSchema,
  reminderOverviewSchema,
  reminderUnsubscribeSchema,
  removePushSubscriptionSchema,
  updateReminderSettingsSchema,
} from '@mycogni/contracts'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { forPatients } from '../../plugins/account-type.ts'
import { currentUser } from '../../plugins/authentication.ts'
import type { ReminderService } from './reminder.service.ts'

export function reminderRoutes(service: ReminderService): FastifyPluginCallbackZod {
  return (app, _options, done) => {
    app.get(
      '/reminders',
      { config: forPatients, schema: { response: { 200: reminderOverviewSchema } } },
      (request) => service.overview(currentUser(request)),
    )
    app.put(
      '/reminders',
      {
        config: forPatients,
        schema: { body: updateReminderSettingsSchema, response: { 200: reminderOverviewSchema } },
      },
      (request) => service.save(currentUser(request), request.body),
    )
    app.post(
      '/push/subscriptions',
      { config: forPatients, schema: { body: pushSubscriptionSchema } },
      async (request, reply) => {
        await service.subscribe(currentUser(request), request.body)
        return reply.status(204).send()
      },
    )
    app.delete(
      '/push/subscriptions',
      { config: forPatients, schema: { body: removePushSubscriptionSchema } },
      async (request, reply) => {
        await service.unsubscribe(currentUser(request), request.body.endpoint)
        return reply.status(204).send()
      },
    )
    done()
  }
}

export function reminderPublicRoutes(service: ReminderService): FastifyPluginCallbackZod {
  return (app, _options, done) => {
    app.post(
      '/reminders/email-off',
      { schema: { body: reminderUnsubscribeSchema } },
      async (request, reply) => {
        await service.emailOff(request.body.token)
        return reply.status(204).send()
      },
    )
    done()
  }
}
