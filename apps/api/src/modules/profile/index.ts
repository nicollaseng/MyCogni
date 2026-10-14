import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import type { Database } from '../../db/client.ts'
import { createProfileRepository } from './profile.repository.ts'
import { profileRoutes } from './profile.routes.ts'
import { createProfileService } from './profile.service.ts'

export function profileModule(db: Database): FastifyPluginCallbackZod {
  return profileRoutes(createProfileService(createProfileRepository(db)))
}
