import type { MeditationId } from '../../meditation-ids.ts'
import type { TopicId } from '../../topics.ts'
import type { ContentLanguage, Reference } from '../types.ts'

export interface SegmentPlan {
  pause: number
  longPause: number
  longOnly?: true
}

export interface MeditationText {
  title: string
  summary: string
  lines: readonly string[]
}

export interface Meditation {
  id: MeditationId
  topic: TopicId
  plan: readonly [SegmentPlan, ...SegmentPlan[]]
  text: Readonly<Record<ContentLanguage, MeditationText>>
  references: readonly [Reference, ...Reference[]]
}

export function both(pause: number, longPause: number): SegmentPlan {
  return { pause, longPause }
}

export function longOnly(longPause: number): SegmentPlan {
  return { pause: 0, longPause, longOnly: true }
}
