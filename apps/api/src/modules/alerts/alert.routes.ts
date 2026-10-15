import { alertCountSchema, alertQuerySchema, professionalAlertListSchema } from '@mycogni/contracts'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { currentUser } from '../../plugins/authentication.ts'
import type { AlertService } from './alert.service.ts'

const byId = z.object({ id: z.uuid() })

export function alertRoutes(service: AlertService): FastifyPluginCallbackZod {
  return (app, _options, done) => {
    app.get(
      '/professional/alerts',
      { schema: { querystring: alertQuerySchema, response: { 200: professionalAlertListSchema } } },
      (request) => service.list(currentUser(request), request.query),
    )
    app.get(
      '/professional/alerts/count',
      { schema: { response: { 200: alertCountSchema } } },
      (request) => service.count(currentUser(request)),
    )
    app.post(
      '/professional/alerts/:id/acknowledge',
      { schema: { params: byId } },
      async (request, reply) => {
        await service.acknowledge(currentUser(request), request.params.id)
        return reply.status(204).send()
      },
    )
    app.post(
      '/professional/alerts/:id/resolve',
      { schema: { params: byId } },
      async (request, reply) => {
        await service.resolve(currentUser(request), request.params.id)
        return reply.status(204).send()
      },
    )
    done()
  }
}
