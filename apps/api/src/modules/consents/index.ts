import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import type { Database } from '../../db/client.ts'
import { createConsentRepository } from './consent.repository.ts'
import { consentRoutes } from './consent.routes.ts'
import { createConsentService } from './consent.service.ts'

export function consentModule(db: Database): FastifyPluginCallbackZod {
  return consentRoutes(createConsentService(createConsentRepository(db)))
}
