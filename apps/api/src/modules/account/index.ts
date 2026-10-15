import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import type { AccountAdmin } from '../../auth/account-admin.ts'
import type { Database } from '../../db/client.ts'
import type { BucketStore } from '../../storage/bucket-store.ts'
import { createAccountRepository } from './account.repository.ts'
import { accountRoutes } from './account.routes.ts'
import { createAccountService } from './account.service.ts'

export function accountModule(
  db: Database,
  admin: AccountAdmin,
  buckets: readonly BucketStore[],
): FastifyPluginCallbackZod {
  return accountRoutes(
    createAccountService({ repository: createAccountRepository(db), admin, buckets }),
  )
}
