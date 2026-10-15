import type { FastifyBaseLogger } from 'fastify'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import type { Database } from '../../db/client.ts'
import type { JobScheduler } from '../../jobs/scheduler.ts'
import { createNoteSafety } from '../safety/note-safety.ts'
import { createCheckInAddendumRepository } from './check-in-addendum.repository.ts'
import { createCheckInRepository } from './check-in.repository.ts'
import { checkInRoutes } from './check-in.routes.ts'
import { createCheckInService } from './check-in.service.ts'

export function checkInModule(
  db: Database,
  jobs: JobScheduler,
  log: Pick<FastifyBaseLogger, 'info'>,
): FastifyPluginCallbackZod {
  return checkInRoutes(
    createCheckInService({
      checkIns: createCheckInRepository(db),
      addenda: createCheckInAddendumRepository(db),
      jobs,
      safety: createNoteSafety(jobs, log),
    }),
  )
}
