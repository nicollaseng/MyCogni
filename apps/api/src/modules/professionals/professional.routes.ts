import {
  emergencyWhatsappSchema,
  professionalProfileSchema,
  registerProfessionalSchema,
  submitProfessionalDocumentSchema,
  updateProfessionalSchema,
} from '@mycogni/contracts'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { forProfessionals } from '../../plugins/account-type.ts'
import { currentUser } from '../../plugins/authentication.ts'
import type { ProfessionalService } from './professional.service.ts'

export function professionalRoutes(service: ProfessionalService): FastifyPluginCallbackZod {
  return (app, _options, done) => {
    app.get(
      '/professional',
      { config: forProfessionals, schema: { response: { 200: professionalProfileSchema } } },
      (request) => service.get(currentUser(request)),
    )
    app.post(
      '/professional',
      {
        config: forProfessionals,
        schema: { body: registerProfessionalSchema, response: { 201: professionalProfileSchema } },
      },
      async (request, reply) =>
        reply.status(201).send(await service.register(currentUser(request), request.body)),
    )
    app.patch(
      '/professional',
      {
        config: forProfessionals,
        schema: { body: updateProfessionalSchema, response: { 200: professionalProfileSchema } },
      },
      (request) => service.rename(currentUser(request), request.body),
    )
    app.put(
      '/professional/emergency-whatsapp',
      {
        config: forProfessionals,
        schema: { body: emergencyWhatsappSchema, response: { 200: professionalProfileSchema } },
      },
      (request) => service.setEmergencyWhatsapp(currentUser(request), request.body),
    )
    app.post(
      '/professional/documents',
      {
        config: forProfessionals,
        schema: {
          body: submitProfessionalDocumentSchema,
          response: { 201: professionalProfileSchema },
        },
      },
      async (request, reply) =>
        reply.status(201).send(await service.submitDocument(currentUser(request), request.body)),
    )
    done()
  }
}
