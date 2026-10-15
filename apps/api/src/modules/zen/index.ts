import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import type { Database } from '../../db/client.ts'
import { createZenRepository } from './zen.repository.ts'
import { zenRoutes } from './zen.routes.ts'
import { createZenService } from './zen.service.ts'

export function zenModule(db: Database): FastifyPluginCallbackZod {
  return zenRoutes(createZenService(createZenRepository(db)))
}
