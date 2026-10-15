import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import type { Database } from '../../db/client.ts'
import type { BucketStore } from '../../storage/bucket-store.ts'
import { documentLinkLifetimeSeconds } from '../../storage/profile-files.ts'
import { createAdminRepository } from './admin.repository.ts'
import { adminRoutes } from './admin.routes.ts'
import { createAdminService } from './admin.service.ts'

export function adminModule(db: Database, documents: BucketStore): FastifyPluginCallbackZod {
  return adminRoutes(
    createAdminService({
      repository: createAdminRepository(db),
      documents,
      linkLifetimeSeconds: documentLinkLifetimeSeconds,
      now: () => new Date(),
    }),
  )
}
