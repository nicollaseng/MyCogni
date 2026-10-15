import {
  checkInCountSchema,
  checkInDetailSchema,
  checkInFilterSchema,
  checkInListSchema,
  checkInSearchSchema,
  createCheckInAddendumSchema,
  createCheckInSchema,
  recordedAddendumSchema,
  recordedCheckInSchema,
} from '@mycogni/contracts'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { forPatients } from '../../plugins/account-type.ts'
import { currentUser } from '../../plugins/authentication.ts'
import type { CheckInService } from './check-in.service.ts'

const byId = z.object({ id: z.uuid() })

export function checkInRoutes(service: CheckInService): FastifyPluginCallbackZod {
  return (app, _options, done) => {
    app.get(
      '/check-ins',
      {
        config: forPatients,
        schema: { querystring: checkInSearchSchema, response: { 200: checkInListSchema } },
      },
      (request) => service.list(currentUser(request), request.query),
    )
    app.get(
      '/check-ins/count',
      {
        config: forPatients,
        schema: { querystring: checkInFilterSchema, response: { 200: checkInCountSchema } },
      },
      (request) => service.count(currentUser(request), request.query),
    )
    app.post(
      '/check-ins',
      {
        config: forPatients,
        schema: { body: createCheckInSchema, response: { 201: recordedCheckInSchema } },
      },
      async (request, reply) =>
        reply.status(201).send(await service.record(currentUser(request), request.body)),
    )
    app.get(
      '/check-ins/:id',
      { config: forPatients, schema: { params: byId, response: { 200: checkInDetailSchema } } },
      (request) => service.detail(currentUser(request), request.params.id),
    )
    app.post(
      '/check-ins/:id/addenda',
      {
        config: forPatients,
        schema: {
          params: byId,
          body: createCheckInAddendumSchema,
          response: { 201: recordedAddendumSchema },
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
