import { consentListSchema, grantConsentsSchema } from '@mycogni/contracts'
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
    done()
  }
}
