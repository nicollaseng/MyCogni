import type { AssistantConversationSummary } from '@mycogni/contracts'
import { dayKey } from '@mycogni/domain'

export const titleLength = 40

export const historyGroups = ['today', 'yesterday', 'week', 'older'] as const

export type HistoryGroup = (typeof historyGroups)[number]

export interface GroupedConversations {
  group: HistoryGroup
  conversations: AssistantConversationSummary[]
}

const dayInMs = 24 * 60 * 60 * 1000

export function conversationTitle(preview: string): string | null {
  const text = preview.replace(/\s+/g, ' ').trim()
  if (text === '') {
    return null
  }
  if (text.length <= titleLength) {
    return text
  }
  const cut = text.slice(0, titleLength + 1)
  const boundary = cut.lastIndexOf(' ')
  const words = boundary > titleLength / 2 ? cut.slice(0, boundary) : text.slice(0, titleLength)
  return `${words.replace(/[\s,.;:!?-]+$/, '')}…`
}

function daysBetween(day: string, today: string): number {
  return Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${day}T00:00:00Z`)) / dayInMs)
}

function groupOf(days: number): HistoryGroup {
  if (days <= 0) {
    return 'today'
  }
  if (days === 1) {
    return 'yesterday'
  }
  return days < 7 ? 'week' : 'older'
}

export function groupConversations(
  conversations: readonly AssistantConversationSummary[],
  now: Date,
  timeZone: string,
): GroupedConversations[] {
  const today = dayKey(now, timeZone)
  const sorted = [...conversations].sort(
    (first, second) => Date.parse(second.updatedAt) - Date.parse(first.updatedAt),
  )
  return historyGroups.flatMap((group) => {
    const items = sorted.filter(
      (conversation) =>
        groupOf(daysBetween(dayKey(new Date(conversation.updatedAt), timeZone), today)) === group,
    )
    return items.length === 0 ? [] : [{ group, conversations: items }]
  })
}
