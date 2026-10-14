import type { Profile, UpdateProfileInput } from '@mycogni/contracts'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import { NotFoundError } from '../../shared/errors.ts'
import type { ProfileChanges, ProfileRecord, ProfileRepository } from './profile.repository.ts'

export interface ProfileService {
  get(user: AuthenticatedUser): Promise<Profile>
  update(user: AuthenticatedUser, input: UpdateProfileInput): Promise<Profile>
}

function toProfile(record: ProfileRecord, user: AuthenticatedUser): Profile {
  return {
    id: record.id,
    email: user.email,
    displayName: record.displayName,
    timezone: record.timezone,
    onboardingCompletedAt: record.onboardingCompletedAt?.toISOString() ?? null,
  }
}

function toChanges(input: UpdateProfileInput): ProfileChanges {
  return {
    ...(input.displayName === undefined ? {} : { displayName: input.displayName }),
    ...(input.timezone === undefined ? {} : { timezone: input.timezone }),
  }
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
