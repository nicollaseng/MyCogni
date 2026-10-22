import { isRecordable, type PracticeKind } from '@mycogni/domain'
import { z } from 'zod'

export interface PracticeRecord {
  kind: PracticeKind
  contentId: string
  startedAt: Date
  seconds: number
  completed: boolean
}

export type RecordPractice = (practice: PracticeRecord) => Promise<string | null>

export type RememberFeeling = (id: string, feeling: number) => Promise<boolean>

const recordedSchema = z.object({ id: z.uuid() })

export const recordPractice: RecordPractice = async ({ startedAt, ...practice }) => {
  const seconds = Math.min(Math.round(practice.seconds), 4 * 60 * 60)
  if (!isRecordable({ ...practice, seconds })) {
    return null
  }
  try {
    const response = await fetch('/practice/sessions', {
      method: 'POST',
      keepalive: true,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...practice, seconds, startedAt: startedAt.toISOString() }),
    })
    if (!response.ok) {
      return null
    }
    const recorded = recordedSchema.safeParse(await response.json())
    return recorded.success ? recorded.data.id : null
  } catch {
    return null
  }
}

export const rememberFeeling: RememberFeeling = async (id, feeling) => {
  try {
    const response = await fetch(`/practice/sessions/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ feelingAfter: feeling }),
    })
    return response.ok
  } catch {
    return false
  }
}
