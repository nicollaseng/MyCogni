import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import type { Database } from '../../db/client.ts'
import type { JobScheduler } from '../../jobs/scheduler.ts'
import { createCheckInAddendumRepository } from './check-in-addendum.repository.ts'
import { createCheckInRepository } from './check-in.repository.ts'
import { checkInRoutes } from './check-in.routes.ts'
import { createCheckInService } from './check-in.service.ts'

export function checkInModule(db: Database, jobs: JobScheduler): FastifyPluginCallbackZod {
  return checkInRoutes(
    createCheckInService(createCheckInRepository(db), jobs, createCheckInAddendumRepository(db)),
  )
}
