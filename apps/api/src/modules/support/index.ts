import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import type { Database } from '../../db/client.ts'
import type { Mailer } from '../../mail/mailer.ts'
import type { RateLimiter } from '../../shared/rate-limiter.ts'
import type { BucketStore } from '../../storage/bucket-store.ts'
import { documentLinkLifetimeSeconds } from '../../storage/profile-files.ts'
import { createSupportRepository } from './support.repository.ts'
import { supportRoutes } from './support.routes.ts'
import { createSupportService } from './support.service.ts'

export interface SupportModuleOptions {
  db: Database
  attachments: BucketStore
  mailer: Mailer
  limiter: RateLimiter
  webUrl: string
  supportEmail: string
}

export function supportModule({
  db,
  ...dependencies
}: SupportModuleOptions): FastifyPluginCallbackZod {
  return supportRoutes(
    createSupportService({
      ...dependencies,
      repository: createSupportRepository(db),
      linkLifetimeSeconds: documentLinkLifetimeSeconds,
      now: () => new Date(),
    }),
  )
}
