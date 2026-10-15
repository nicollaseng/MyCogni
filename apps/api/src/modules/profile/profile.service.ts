import type { Profile, UpdateProfileInput } from '@mycogni/contracts'
import { isLocale } from '@mycogni/domain'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import { NotFoundError, UnprocessableError } from '../../shared/errors.ts'
import type { ProfileChanges, ProfileRecord, ProfileRepository } from './profile.repository.ts'

export interface ProfileService {
  get(user: AuthenticatedUser): Promise<Profile>
  update(user: AuthenticatedUser, input: UpdateProfileInput): Promise<Profile>
}

export function toProfile(record: ProfileRecord, user: AuthenticatedUser): Profile {
  return {
    id: record.id,
    email: user.email,
    displayName: record.displayName,
    avatarPath: record.avatarPath,
    timezone: record.timezone,
    locale: isLocale(record.locale) ? record.locale : null,
    onboardingCompletedAt: record.onboardingCompletedAt?.toISOString() ?? null,
  }
}

function toChanges(input: UpdateProfileInput): ProfileChanges {
  return {
    ...(input.displayName === undefined ? {} : { displayName: input.displayName }),
    ...(input.timezone === undefined ? {} : { timezone: input.timezone }),
    ...(input.locale === undefined ? {} : { locale: input.locale }),
    ...(input.avatarPath === undefined ? {} : { avatarPath: input.avatarPath }),
  }
}

function ownsAvatar(user: AuthenticatedUser, avatarPath: string | null | undefined): boolean {
  return avatarPath === undefined || avatarPath === null || avatarPath.startsWith(`${user.id}/`)
}

export function createProfileService(repository: ProfileRepository): ProfileService {
  async function findOrFail(user: AuthenticatedUser): Promise<ProfileRecord> {
    const record = await repository.findById(user.id)
    if (record === undefined) {
      throw new NotFoundError('Profile not found')
    }
    return record
  }

  return {
    async get(user) {
      return toProfile(await findOrFail(user), user)
    },
    async update(user, input) {
      if (!ownsAvatar(user, input.avatarPath)) {
        throw new UnprocessableError('The photo must be stored in your own folder')
      }
      const changes = toChanges(input)
      if (Object.keys(changes).length === 0) {
        return toProfile(await findOrFail(user), user)
      }
      const record = await repository.update(user.id, changes)
      if (record === undefined) {
        throw new NotFoundError('Profile not found')
      }
      return toProfile(record, user)
    },
  }
}
