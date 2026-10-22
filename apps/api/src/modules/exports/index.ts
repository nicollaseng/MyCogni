import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import type { Database } from '../../db/client.ts'
import type { JobScheduler } from '../../jobs/scheduler.ts'
import type { RateLimiter } from '../../shared/rate-limiter.ts'
import type { BucketStore } from '../../storage/bucket-store.ts'
import { createDataExportRepository } from './export.repository.ts'
import { dataExportRoutes } from './export.routes.ts'
import { createDataExportService } from './export.service.ts'

export interface DataExportModuleOptions {
  db: Database
  store: BucketStore
  jobs: JobScheduler
  limiter: RateLimiter
}

export function dataExportModule({
  db,
  store,
  jobs,
  limiter,
}: DataExportModuleOptions): FastifyPluginCallbackZod {
  return dataExportRoutes(
    createDataExportService({
      repository: createDataExportRepository(db),
      store,
      jobs,
      limiter,
      now: () => new Date(),
    }),
  )
}
