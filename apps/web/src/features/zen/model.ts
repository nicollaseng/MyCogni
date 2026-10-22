import type { TrackProgress, TrackStep } from '@mycogni/domain'

export type TrackStatus = 'new' | 'started' | 'complete'

export function trackStatusOf({ started, complete }: TrackProgress): TrackStatus {
  if (complete) {
    return 'complete'
  }
  return started ? 'started' : 'new'
}

export function hasStepAction(step: TrackStep, meditation = false): boolean {
  if (step.kind === 'meditate') {
    return meditation
  }
  return step.kind !== 'reflect' && step.kind !== 'support'
}
