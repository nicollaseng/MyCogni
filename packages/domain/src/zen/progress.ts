import { tracks, type TrackId, type TrackStep } from './catalog.ts'

export interface DoneStep {
  trackId: TrackId
  stepId: string
}

export interface TrackProgress {
  done: readonly string[]
  total: number
  next: TrackStep | null
  started: boolean
  complete: boolean
}

export function progressOf(trackId: TrackId, doneSteps: readonly DoneStep[]): TrackProgress {
  const { steps } = tracks[trackId]
  const done = steps
    .filter((step) =>
      doneSteps.some((entry) => entry.trackId === trackId && entry.stepId === step.id),
    )
    .map((step) => step.id)
  return {
    done,
    total: steps.length,
    next: steps.find((step) => !done.includes(step.id)) ?? null,
    started: done.length > 0,
    complete: done.length === steps.length,
  }
}
