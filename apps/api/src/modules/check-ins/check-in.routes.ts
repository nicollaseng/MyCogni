import {
  checkInListSchema,
  checkInQuerySchema,
  checkInSchema,
  createCheckInSchema,
} from '@mycogni/contracts'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { currentUser } from '../../plugins/authentication.ts'
import type { CheckInService } from './check-in.service.ts'

export function checkInRoutes(service: CheckInService): FastifyPluginCallbackZod {
  return (app, _options, done) => {
    app.get(
      '/check-ins',
      { schema: { querystring: checkInQuerySchema, response: { 200: checkInListSchema } } },
      (request) => service.list(currentUser(request), request.query),
    )
    app.post(
      '/check-ins',
      { schema: { body: createCheckInSchema, response: { 201: checkInSchema } } },
      async (request, reply) =>
        reply.status(201).send(await service.record(currentUser(request), request.body)),
    )
    done()
  }
}
