import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import type { Database } from '../../db/client.ts'
import { createAdminRepository } from './admin.repository.ts'
import { adminRoutes } from './admin.routes.ts'
import { createAdminService } from './admin.service.ts'

export function adminModule(db: Database): FastifyPluginCallbackZod {
  return adminRoutes(createAdminService(createAdminRepository(db)))
}
