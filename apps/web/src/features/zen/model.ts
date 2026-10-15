import type { TrackProgress } from '@mycogni/domain'
import type { TrackStatus } from './components/status-dot'

export function trackStatusOf({ started, complete }: TrackProgress): TrackStatus {
  if (complete) {
    return 'complete'
  }
  return started ? 'started' : 'new'
}
