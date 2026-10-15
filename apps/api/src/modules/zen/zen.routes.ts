import { stepProgressListSchema, stepProgressSchema, zenStepParamsSchema } from '@mycogni/contracts'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { forPatients } from '../../plugins/account-type.ts'
import { currentUser } from '../../plugins/authentication.ts'
import type { ZenService } from './zen.service.ts'

export function zenRoutes(service: ZenService): FastifyPluginCallbackZod {
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
    done()
  }
}
