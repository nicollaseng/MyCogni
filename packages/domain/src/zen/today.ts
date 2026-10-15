import { trackIds, type TrackId, type TrackStep } from './catalog.ts'
import { progressOf, type DoneStep } from './progress.ts'

export interface TodayPick {
  trackId: TrackId
  step: TrackStep
  started: boolean
}

export function todayPick(
  suggested: readonly TrackId[],
  doneSteps: readonly DoneStep[],
): TodayPick | null {
  for (const trackId of [...suggested, ...trackIds]) {
    const progress = progressOf(trackId, doneSteps)
    if (progress.next !== null) {
      return { trackId, step: progress.next, started: progress.started }
    }
  }
  return null
}
