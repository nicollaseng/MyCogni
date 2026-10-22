import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import type { Database } from '../../db/client.ts'
import type { Mailer } from '../../mail/mailer.ts'
import type { BucketStore } from '../../storage/bucket-store.ts'
import { documentLinkLifetimeSeconds } from '../../storage/profile-files.ts'
import { createAdminRepository } from './admin.repository.ts'
import { adminRoutes } from './admin.routes.ts'
import { createAdminService } from './admin.service.ts'

export interface AdminModuleOptions {
  db: Database
  documents: BucketStore
  photos: BucketStore
  mailer: Mailer
  webUrl: string
}

export function adminModule({
  db,
  documents,
  photos,
  mailer,
  webUrl,
}: AdminModuleOptions): FastifyPluginCallbackZod {
  return adminRoutes(
    createAdminService({
      repository: createAdminRepository(db),
      documents,
      photos,
      mailer,
      webUrl,
      linkLifetimeSeconds: documentLinkLifetimeSeconds,
      now: () => new Date(),
    }),
  )
}
