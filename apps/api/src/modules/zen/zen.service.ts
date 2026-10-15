import type { StepProgress, ZenStepParams } from '@mycogni/contracts'
import { isTrackId, isTrackStep } from '@mycogni/domain'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import type { StepRecord, ZenRepository } from './zen.repository.ts'

export interface ZenService {
  progress(user: AuthenticatedUser): Promise<StepProgress[]>
  complete(user: AuthenticatedUser, step: ZenStepParams): Promise<StepProgress>
  undo(user: AuthenticatedUser, step: ZenStepParams): Promise<void>
}

function toProgress(record: StepRecord): StepProgress[] {
  const { trackId, stepId, completedAt } = record
  return isTrackId(trackId) && isTrackStep(trackId, stepId)
    ? [{ trackId, stepId, completedAt: completedAt.toISOString() }]
    : []
}

export function createZenService(repository: ZenRepository): ZenService {
  return {
    async progress(user) {
      const records = await repository.list(user.id)
      return records.flatMap(toProgress)
    },
    async complete(user, step) {
      const record = await repository.complete(user.id, step)
      return { ...step, completedAt: record.completedAt.toISOString() }
    },
    undo(user, step) {
      return repository.undo(user.id, step)
    },
  }
}
