import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import type { Database } from '../../db/client.ts'
import { createMemoryRepository } from './memory.repository.ts'
import { memoryRoutes } from './memory.routes.ts'
import { createMemoryService } from './memory.service.ts'

export function memoryModule(db: Database): FastifyPluginCallbackZod {
  return memoryRoutes(createMemoryService(createMemoryRepository(db)))
}
