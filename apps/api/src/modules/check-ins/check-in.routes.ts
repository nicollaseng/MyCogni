import {
  checkInAddendumSchema,
  checkInCountSchema,
  checkInDetailSchema,
  checkInFilterSchema,
  checkInListSchema,
  checkInSchema,
  checkInSearchSchema,
  createCheckInAddendumSchema,
  createCheckInSchema,
} from '@mycogni/contracts'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { currentUser } from '../../plugins/authentication.ts'
import type { CheckInService } from './check-in.service.ts'

const byId = z.object({ id: z.uuid() })

export function checkInRoutes(service: CheckInService): FastifyPluginCallbackZod {
  return (app, _options, done) => {
    app.get(
      '/check-ins',
      { schema: { querystring: checkInSearchSchema, response: { 200: checkInListSchema } } },
      (request) => service.list(currentUser(request), request.query),
    )
    app.get(
      '/check-ins/count',
      { schema: { querystring: checkInFilterSchema, response: { 200: checkInCountSchema } } },
      (request) => service.count(currentUser(request), request.query),
    )
    app.post(
      '/check-ins',
      { schema: { body: createCheckInSchema, response: { 201: checkInSchema } } },
      async (request, reply) =>
        reply.status(201).send(await service.record(currentUser(request), request.body)),
    )
    app.get(
      '/check-ins/:id',
      { schema: { params: byId, response: { 200: checkInDetailSchema } } },
      (request) => service.detail(currentUser(request), request.params.id),
    )
    app.post(
      '/check-ins/:id/addenda',
      {
        schema: {
          params: byId,
          body: createCheckInAddendumSchema,
          response: { 201: checkInAddendumSchema },
        },
      },
      async (request, reply) =>
        reply
          .status(201)
          .send(await service.append(currentUser(request), request.params.id, request.body)),
    )
    done()
  }
}
