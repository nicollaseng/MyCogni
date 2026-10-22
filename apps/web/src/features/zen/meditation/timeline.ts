import type { MeditationLine, MeditationStep } from './options'

export type TimelineItem =
  | { kind: 'voice'; index: number; url: string; start: number; duration: number }
  | { kind: 'silence'; start: number; duration: number }

export interface Timeline {
  items: readonly TimelineItem[]
  total: number
}

export function buildTimeline(
  plan: readonly MeditationStep[],
  lines: readonly MeditationLine[],
): Timeline {
  const items: TimelineItem[] = []
  let cursor = 0
  for (const step of plan) {
    const line = lines.find((candidate) => candidate.index === step.index)
    if (line !== undefined) {
      items.push({
        kind: 'voice',
        index: step.index,
        url: line.url,
        start: cursor,
        duration: line.seconds,
      })
      cursor += line.seconds
    }
    if (step.pause > 0) {
      items.push({ kind: 'silence', start: cursor, duration: step.pause })
      cursor += step.pause
    }
  }
  return { items, total: cursor }
}

export function itemAt(timeline: Timeline, position: number): TimelineItem | null {
  return (
    timeline.items.find(
      (item) => position >= item.start && position < item.start + item.duration,
    ) ?? null
  )
}
