import type { Profile, UpdateProfileInput } from '@mycogni/contracts'
import {
  avatarExtension,
  isBrandNewAccount,
  isLocale,
  isOwnAvatarPath,
  sniffAvatarType,
} from '@mycogni/domain'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import {
  AccountTypeLockedError,
  IdentityLockedError,
  NotFoundError,
  UnprocessableError,
  UnsupportedMediaTypeError,
} from '../../shared/errors.ts'
import type { BucketStore } from '../../storage/bucket-store.ts'
import { fileHead } from '../../storage/file-head.ts'
import {
  LockedPhotoError,
  type ProfileChanges,
  type ProfileRecord,
  type ProfileRepository,
} from './profile.repository.ts'

export interface ProfileService {
  get(user: AuthenticatedUser): Promise<Profile>
  update(user: AuthenticatedUser, input: UpdateProfileInput): Promise<Profile>
  adoptProfessional(user: AuthenticatedUser): Promise<Profile>
}

export function toProfile(record: ProfileRecord, user: AuthenticatedUser): Profile {
  return {
    id: record.id,
    email: user.email,
    accountType: record.accountType,
    displayName: record.displayName,
    avatarPath: record.avatarPath,
    timezone: record.timezone,
    locale: isLocale(record.locale) ? record.locale : null,
    journalInInsights: record.journalInInsights,
    memoriesEnabled: record.memoriesEnabled,
    termsOutdated: record.termsOutdated,
    onboardingCompletedAt: record.onboardingCompletedAt?.toISOString() ?? null,
  }
}

function toChanges(input: UpdateProfileInput): ProfileChanges {
  return {
    ...(input.displayName === undefined ? {} : { displayName: input.displayName }),
    ...(input.timezone === undefined ? {} : { timezone: input.timezone }),
    ...(input.locale === undefined ? {} : { locale: input.locale }),
    ...(input.journalInInsights === undefined
      ? {}
      : { journalInInsights: input.journalInInsights }),
    ...(input.memoriesEnabled === undefined ? {} : { memoriesEnabled: input.memoriesEnabled }),
    ...(input.avatarPath === undefined ? {} : { avatarPath: input.avatarPath }),
  }
}

function ownsAvatar(user: AuthenticatedUser, avatarPath: string | null | undefined): boolean {
  return avatarPath === undefined || avatarPath === null || isOwnAvatarPath(avatarPath, user.id)
}

async function verifyPhotoContent(photos: Pick<BucketStore, 'open'>, path: string): Promise<void> {
  const head = await fileHead(photos, path)
  if (head === null) {
    throw new UnprocessableError('Upload the photo to your folder before saving it')
  }
  const type = sniffAvatarType(head)
  if (type === null || !path.endsWith(`.${avatarExtension(type)}`)) {
    throw new UnsupportedMediaTypeError(
      'UNSUPPORTED_TYPE',
      'The photo content is not the JPG, PNG or WebP image it claims to be',
    )
  }
}

export function createProfileService(
  repository: ProfileRepository,
  photos: Pick<BucketStore, 'open'>,
  now: () => Date,
): ProfileService {
  async function findOrFail(user: AuthenticatedUser): Promise<ProfileRecord> {
    const record = await repository.findById(user.id)
    if (record === undefined) {
      throw new NotFoundError('Profile not found')
    }
    return record
  }

  async function checkPhoto(user: AuthenticatedUser, avatarPath: string | null): Promise<void> {
    if (await repository.photoLocked(user.id)) {
      throw new IdentityLockedError()
    }
    if (avatarPath !== null) {
      await verifyPhotoContent(photos, avatarPath)
    }
  }

  async function saved(user: AuthenticatedUser, changes: ProfileChanges) {
    try {
      return await repository.update(user.id, changes)
    } catch (error) {
      if (error instanceof LockedPhotoError) {
        throw new IdentityLockedError()
      }
      throw error
    }
  }

  return {
    async get(user) {
      return toProfile(await findOrFail(user), user)
    },
    async update(user, input) {
      if (!ownsAvatar(user, input.avatarPath)) {
        throw new UnprocessableError('The photo must be stored in your own folder')
      }
      if (input.avatarPath !== undefined) {
        await checkPhoto(user, input.avatarPath)
      }
      const changes = toChanges(input)
      if (Object.keys(changes).length === 0) {
        return toProfile(await findOrFail(user), user)
      }
      const record = await saved(user, changes)
      if (record === undefined) {
        throw new NotFoundError('Profile not found')
      }
      return toProfile(record, user)
    },
    async adoptProfessional(user) {
      const account = await repository.footprint(user.id)
      if (account === undefined) {
        throw new NotFoundError('Profile not found')
      }
      if (account.accountType !== 'patient' || !isBrandNewAccount(account, now())) {
        throw new AccountTypeLockedError()
      }
      const record = await repository.adoptProfessional(user.id)
      if (record === undefined) {
        throw new AccountTypeLockedError()
      }
      return toProfile(record, user)
    },
  }
}
