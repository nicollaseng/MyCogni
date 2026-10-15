import type { TrackProgress, TrackStep } from '@mycogni/domain'
import type { TrackStatus } from './components/status-dot'

export function trackStatusOf({ started, complete }: TrackProgress): TrackStatus {
  if (complete) {
    return 'complete'
  }
  return started ? 'started' : 'new'
}

export function hasStepAction(step: TrackStep): boolean {
  return step.kind !== 'reflect' && step.kind !== 'support'
}
