import {
  professionalProfileSchema,
  registerProfessionalSchema,
  updateProfessionalSchema,
} from '@mycogni/contracts'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { currentUser } from '../../plugins/authentication.ts'
import type { ProfessionalService } from './professional.service.ts'

export function professionalRoutes(service: ProfessionalService): FastifyPluginCallbackZod {
  return (app, _options, done) => {
    app.get(
      '/professional',
      { schema: { response: { 200: professionalProfileSchema } } },
      (request) => service.get(currentUser(request)),
    )
    app.post(
      '/professional',
      {
        schema: { body: registerProfessionalSchema, response: { 201: professionalProfileSchema } },
      },
      async (request, reply) =>
        reply.status(201).send(await service.register(currentUser(request), request.body)),
    )
    app.patch(
      '/professional',
      { schema: { body: updateProfessionalSchema, response: { 200: professionalProfileSchema } } },
      (request) => service.rename(currentUser(request), request.body),
    )
    done()
  }
}
