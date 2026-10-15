import { consentKindSchema, consentListSchema, grantConsentsSchema } from '@mycogni/contracts'
import { z } from 'zod'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { currentUser } from '../../plugins/authentication.ts'
import type { ConsentService } from './consent.service.ts'

export function consentRoutes(service: ConsentService): FastifyPluginCallbackZod {
  return (app, _options, done) => {
    app.get('/consents', { schema: { response: { 200: consentListSchema } } }, (request) =>
      service.list(currentUser(request)),
    )
    app.post(
      '/consents',
      { schema: { body: grantConsentsSchema, response: { 201: consentListSchema } } },
      async (request, reply) =>
        reply.status(201).send(await service.grant(currentUser(request), request.body)),
    )
    app.delete(
      '/consents/:kind',
      { schema: { params: z.object({ kind: consentKindSchema }) } },
      async (request, reply) => {
        await service.revoke(currentUser(request), request.params.kind)
        return reply.status(204).send()
      },
    )
    done()
  }
}
