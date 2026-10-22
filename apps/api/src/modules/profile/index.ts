import type { FastifyBaseLogger } from 'fastify'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import type { AccountAdmin } from '../../auth/account-admin.ts'
import type { Database } from '../../db/client.ts'
import type { BucketStore } from '../../storage/bucket-store.ts'
import { downloadPhoto, type Fetcher } from './photo-download.ts'
import { createProfileRepository } from './profile.repository.ts'
import { profileRoutes } from './profile.routes.ts'
import { createProfileService } from './profile.service.ts'
import { createProviderPhotoImporter } from './provider-photo.service.ts'

export interface ProfileModuleOptions {
  db: Database
  accounts: AccountAdmin
  photos: BucketStore
  fetcher: Fetcher
  log: Pick<FastifyBaseLogger, 'warn'>
}

export function profileModule({
  db,
  accounts,
  photos,
  fetcher,
  log,
}: ProfileModuleOptions): FastifyPluginCallbackZod {
  const repository = createProfileRepository(db)
  return profileRoutes(
    createProfileService(repository, photos, () => new Date()),
    createProviderPhotoImporter({
      accounts,
      profiles: repository,
      photos,
      download: (url) => downloadPhoto(fetcher, url),
      log,
      now: () => new Date(),
    }),
  )
}
