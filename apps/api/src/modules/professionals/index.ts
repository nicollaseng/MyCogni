import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import type { Database } from '../../db/client.ts'
import { createProfessionalRepository } from './professional.repository.ts'
import { professionalRoutes } from './professional.routes.ts'
import { createProfessionalService } from './professional.service.ts'

export function professionalModule(db: Database): FastifyPluginCallbackZod {
  return professionalRoutes(createProfessionalService(createProfessionalRepository(db)))
}
