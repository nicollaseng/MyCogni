import {
  emptyAnswers,
  isAnswer,
  screeningDomains,
  type Answer,
  type DomainAnswers,
  type ItemAnswers,
  type ScreeningDomain,
} from '@mycogni/domain'
import { z } from 'zod'

export interface ScreeningDraft {
  updatedAt: number
  answers: DomainAnswers
  saved: Readonly<Partial<Record<ScreeningDomain, string>>>
}

export const draftLifetimeDays = 7

const dayInMs = 24 * 60 * 60 * 1000

const keyPrefix = 'mycogni.screening.draft.'

const itemAnswersSchema = z.record(z.string().regex(/^\d+$/), z.custom<Answer>(isAnswer))

const draftSchema = z.object({
  updatedAt: z.number().int().nonnegative(),
  answers: z.object({ depression: itemAnswersSchema, anxiety: itemAnswersSchema }),
  saved: z.object({ depression: z.uuid().optional(), anxiety: z.uuid().optional() }),
})

function keyOf(userId: string): string {
  return `${keyPrefix}${userId}`
}

function itemAnswersOf(stored: Readonly<Record<string, Answer>>): ItemAnswers {
  return Object.fromEntries(Object.entries(stored).map(([item, value]) => [Number(item), value]))
}

export function readScreeningDraft(
  userId: string,
  now: number = Date.now(),
): ScreeningDraft | null {
  try {
    const stored = window.localStorage.getItem(keyOf(userId))
    if (stored === null) {
      return null
    }
    const parsed = draftSchema.safeParse(JSON.parse(stored))
    if (!parsed.success || now - parsed.data.updatedAt > draftLifetimeDays * dayInMs) {
      window.localStorage.removeItem(keyOf(userId))
      return null
    }
    const answers = Object.fromEntries(
      screeningDomains.map((domain) => [domain, itemAnswersOf(parsed.data.answers[domain])]),
    )
    return {
      updatedAt: parsed.data.updatedAt,
      answers: { ...emptyAnswers, ...answers },
      saved: parsed.data.saved,
    }
  } catch {
    return null
  }
}

export function hasScreeningDraft(userId: string): boolean {
  try {
    return window.localStorage.getItem(keyOf(userId)) !== null
  } catch {
    return false
  }
}

export function writeScreeningDraft(userId: string, draft: ScreeningDraft): boolean {
  try {
    window.localStorage.setItem(keyOf(userId), JSON.stringify(draft))
    return true
  } catch {
    return false
  }
}

export function forgetScreeningDraft(userId: string): boolean {
  try {
    window.localStorage.removeItem(keyOf(userId))
    return true
  } catch {
    return false
  }
}
