import type { ArticleId, TrackId } from './catalog.ts'

export const topicIds = ['anxiety', 'mood', 'sleep', 'performance', 'help'] as const

export type TopicId = (typeof topicIds)[number]

export interface Topic {
  id: TopicId
  track: TrackId
  articles: readonly [ArticleId, ...ArticleId[]]
  breathe: boolean
}

export const topics: Readonly<Record<TopicId, Topic>> = {
  anxiety: {
    id: 'anxiety',
    track: 'everyday-anxiety',
    articles: ['anxiety-basics', 'worry-time', 'breathing-and-grounding'],
    breathe: true,
  },
  mood: {
    id: 'mood',
    track: 'low-mood',
    articles: ['behavioural-activation', 'sleep-and-mood'],
    breathe: false,
  },
  sleep: {
    id: 'sleep',
    track: 'sleep-and-rest',
    articles: ['sleep-and-mood', 'worry-time'],
    breathe: true,
  },
  performance: {
    id: 'performance',
    track: 'performance-anxiety',
    articles: ['performance-anxiety', 'breathing-and-grounding'],
    breathe: true,
  },
  help: {
    id: 'help',
    track: 'seeking-help',
    articles: ['when-to-seek-help', 'screening-not-diagnosis'],
    breathe: false,
  },
}

export function isTopicId(value: unknown): value is TopicId {
  return topicIds.some((id) => id === value)
}
