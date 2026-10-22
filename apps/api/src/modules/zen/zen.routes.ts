import {
  recordZenSessionSchema,
  stepProgressListSchema,
  stepProgressSchema,
  zenSessionFeelingSchema,
  zenSessionListSchema,
  zenSessionQuerySchema,
  zenSessionSchema,
  zenStepParamsSchema,
} from '@mycogni/contracts'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { forPatients } from '../../plugins/account-type.ts'
import { currentUser } from '../../plugins/authentication.ts'
import type { ZenSessionService } from './zen-sessions.service.ts'
import type { ZenService } from './zen.service.ts'

const bySession = z.object({ id: z.uuid() })

export function zenRoutes(
  service: ZenService,
  sessions: ZenSessionService,
): FastifyPluginCallbackZod {
  return (app, _options, done) => {
    app.get(
      '/zen/progress',
      { config: forPatients, schema: { response: { 200: stepProgressListSchema } } },
      (request) => service.progress(currentUser(request)),
    )
    app.put(
      '/zen/progress/:trackId/:stepId',
      {
        config: forPatients,
        schema: { params: zenStepParamsSchema, response: { 200: stepProgressSchema } },
      },
      (request) => service.complete(currentUser(request), request.params),
    )
    app.delete(
      '/zen/progress/:trackId/:stepId',
      { config: forPatients, schema: { params: zenStepParamsSchema } },
      async (request, reply) => {
        await service.undo(currentUser(request), request.params)
        return reply.status(204).send()
      },
    )
    app.get(
      '/zen/sessions',
      {
        config: forPatients,
        schema: { querystring: zenSessionQuerySchema, response: { 200: zenSessionListSchema } },
      },
      (request) => sessions.list(currentUser(request), request.query.since),
    )
    app.post(
      '/zen/sessions',
      {
        config: forPatients,
        schema: { body: recordZenSessionSchema, response: { 201: zenSessionSchema } },
      },
      async (request, reply) =>
        reply.status(201).send(await sessions.record(currentUser(request), request.body)),
    )
    app.patch(
      '/zen/sessions/:id',
      { config: forPatients, schema: { params: bySession, body: zenSessionFeelingSchema } },
      async (request, reply) => {
        await sessions.feel(currentUser(request), request.params.id, request.body)
        return reply.status(204).send()
      },
    )
    done()
  }
}
