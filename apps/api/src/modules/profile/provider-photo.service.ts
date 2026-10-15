import { randomUUID } from 'node:crypto'
import type { ProviderPhotoImport } from '@mycogni/contracts'
import { avatarExtension, googlePhotoUrl } from '@mycogni/domain'
import type { FastifyBaseLogger } from 'fastify'
import type { AccountAdmin, AuthAccount } from '../../auth/account-admin.ts'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import type { BucketStore } from '../../storage/bucket-store.ts'
import type { DownloadedPhoto } from './photo-download.ts'
import type { ProfileRepository } from './profile.repository.ts'

export const providerPhotoMarker = 'provider_photo_handled_at'

const pictureKeys = ['avatar_url', 'picture'] as const

export interface ProviderPhotoImporter {
  importFor(user: AuthenticatedUser): Promise<ProviderPhotoImport>
}

export interface ProviderPhotoDependencies {
  accounts: Pick<AccountAdmin, 'findUser' | 'updateAppMetadata'>
  profiles: Pick<ProfileRepository, 'findById' | 'setAvatarIfEmpty'>
  photos: Pick<BucketStore, 'upload' | 'remove'>
  download: (url: string) => Promise<DownloadedPhoto | null>
  log: Pick<FastifyBaseLogger, 'warn'>
  now: () => Date
}

export function googlePictureOf(account: AuthAccount): string | null {
  const candidates = account.identities
    .filter((identity) => identity.provider === 'google')
    .flatMap((identity) => pictureKeys.map((key) => identity.data[key]))
  for (const candidate of candidates) {
    const url = typeof candidate === 'string' ? googlePhotoUrl(candidate) : null
    if (url !== null) {
      return url
    }
  }
  return null
}

export function createProviderPhotoImporter({
  accounts,
  profiles,
  photos,
  download,
  log,
  now,
}: ProviderPhotoDependencies): ProviderPhotoImporter {
  function markHandled(userId: string): Promise<void> {
    return accounts.updateAppMetadata(userId, { [providerPhotoMarker]: now().toISOString() })
  }

  async function fetchPhoto(url: string): Promise<DownloadedPhoto | null> {
    try {
      return await download(url)
    } catch (error) {
      log.warn({ err: error }, 'Could not download the provider photo')
      return null
    }
  }

  async function store(userId: string, photo: DownloadedPhoto): Promise<boolean> {
    const path = `${userId}/${randomUUID()}.${avatarExtension(photo.type)}`
    await photos.upload(path, photo.content, photo.type)
    const saved = await profiles.setAvatarIfEmpty(userId, path).catch(async (error: unknown) => {
      await photos.remove([path])
      throw error
    })
    if (!saved) {
      await photos.remove([path])
    }
    return saved
  }

  return {
    async importFor(user) {
      const account = await accounts.findUser(user.id)
      if (account === null || account.appMetadata[providerPhotoMarker] !== undefined) {
        return { status: 'skipped' }
      }
      const picture = googlePictureOf(account)
      const profile = picture === null ? undefined : await profiles.findById(user.id)
      if (picture === null || profile === undefined) {
        return { status: 'unavailable' }
      }
      if (profile.avatarPath !== null) {
        await markHandled(user.id)
        return { status: 'skipped' }
      }
      const photo = await fetchPhoto(picture)
      if (photo === null) {
        return { status: 'unavailable' }
      }
      const saved = await store(user.id, photo)
      await markHandled(user.id)
      return { status: saved ? 'imported' : 'skipped' }
    },
  }
}
