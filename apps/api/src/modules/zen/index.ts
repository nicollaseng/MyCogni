import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import type { Database } from '../../db/client.ts'
import { createZenSessionRepository } from './zen-sessions.repository.ts'
import { createZenSessionService } from './zen-sessions.service.ts'
import { createZenRepository } from './zen.repository.ts'
import { zenRoutes } from './zen.routes.ts'
import { createZenService } from './zen.service.ts'

export function zenModule(db: Database): FastifyPluginCallbackZod {
  return zenRoutes(
    createZenService(createZenRepository(db)),
    createZenSessionService(createZenSessionRepository(db)),
  )
}
