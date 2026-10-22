import type { ZenContentStats, ZenStats } from '@mycogni/contracts'
import { isPracticeKind, trackIds, tracks } from '@mycogni/domain'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import { ForbiddenError } from '../../shared/errors.ts'
import type { PracticeStatsRow, TrackStatsRow, ZenStatsRepository } from './zen-stats.repository.ts'

export const zenStatsMinimumPeople = 5

export interface ZenStatsService {
  stats(user: AuthenticatedUser): Promise<ZenStats>
}

const trackSteps = Object.fromEntries(
  trackIds.map((id) => [id, tracks[id].steps.map((step) => step.id)]),
)

function practiceItem(row: PracticeStatsRow): ZenContentStats[] {
  if (!isPracticeKind(row.kind)) {
    return []
  }
  return [
    {
      kind: row.kind,
      contentId: row.content_id,
      people: row.people,
      starts: row.starts,
      completions: row.completions,
      medianSeconds: row.median_seconds,
      comparedPeople: row.compared_people,
      better: row.better,
      same: row.same,
      worse: row.worse,
    },
  ]
}

function trackItem(row: TrackStatsRow): ZenContentStats {
  return {
    kind: 'track',
    contentId: row.track_id,
    people: row.people,
    starts: row.people,
    completions: row.completions,
    medianSeconds: null,
    comparedPeople: null,
    better: null,
    same: null,
    worse: null,
  }
}

export function createZenStatsService(repository: ZenStatsRepository): ZenStatsService {
  return {
    async stats(user) {
      const rows = await repository.read(user.id, trackSteps)
      if (!rows.admin) {
        throw new ForbiddenError('Only the MyCogniAI team can see Zen statistics')
      }
      return {
        minimumPeople: zenStatsMinimumPeople,
        items: [...rows.practice.flatMap(practiceItem), ...rows.tracks.map(trackItem)],
      }
    },
  }
}
