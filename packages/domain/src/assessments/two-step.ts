import type { Answer } from './frequency.ts'
import { screeningDomains, type InstrumentId, type ScreeningDomain } from './instrument.ts'
import { isPositiveScreen, twoStepScreens } from './screens.ts'

export type ItemAnswers = Readonly<Partial<Record<number, Answer>>>

export type DomainAnswers = Readonly<Record<ScreeningDomain, ItemAnswers>>

export interface ScreeningSession {
  answers: DomainAnswers
  saved: Readonly<Partial<Record<ScreeningDomain, InstrumentId>>>
}

export interface ScreeningQuestion {
  domain: ScreeningDomain
  item: number
}

export interface ScreeningRecord {
  domain: ScreeningDomain
  instrument: InstrumentId
  answers: Answer[]
}

export interface ScreeningProgress {
  current: number
  total: number
}

export interface FullFormStart {
  domain: ScreeningDomain
  count: number
}

type ScreenResult = 'pending' | 'negative' | 'positive'

export const emptyAnswers: DomainAnswers = { depression: {}, anxiety: {} }

export const newScreeningSession: ScreeningSession = { answers: emptyAnswers, saved: {} }

function screenItems(domain: ScreeningDomain): readonly number[] {
  const { screen } = twoStepScreens[domain]
  return screen.items.slice(0, screen.scoredItems)
}

function fullFormOnly(domain: ScreeningDomain): readonly number[] {
  const { screen, full } = twoStepScreens[domain]
  return full.items.filter((item) => !screen.items.includes(item))
}

function answersAt(given: ItemAnswers, items: readonly number[]): Answer[] | null {
  const values = items.flatMap((item) => {
    const value = given[item]
    return value === undefined ? [] : [value]
  })
  return values.length === items.length ? values : null
}

function screenResult(session: ScreeningSession, domain: ScreeningDomain): ScreenResult {
  const saved = session.saved[domain]
  if (saved !== undefined) {
    return saved === twoStepScreens[domain].full.id ? 'positive' : 'negative'
  }
  const screen = answersAt(session.answers[domain], screenItems(domain))
  if (screen === null) {
    return 'pending'
  }
  return isPositiveScreen(domain, screen) ? 'positive' : 'negative'
}

function screensDone(session: ScreeningSession): boolean {
  return screeningDomains.every((domain) => screenResult(session, domain) !== 'pending')
}

function extraItems(session: ScreeningSession, domain: ScreeningDomain): number[] {
  const { screen, full } = twoStepScreens[domain]
  const extended = screensDone(session) && screenResult(session, domain) === 'positive'
  return (extended ? full.items : screen.items).filter(
    (item) => !screenItems(domain).includes(item),
  )
}

function isAnswered(session: ScreeningSession, { domain, item }: ScreeningQuestion): boolean {
  return session.saved[domain] !== undefined || session.answers[domain][item] !== undefined
}

function sameQuestion(first: ScreeningQuestion, second: ScreeningQuestion): boolean {
  return first.domain === second.domain && first.item === second.item
}

export function screeningQuestions(session: ScreeningSession): ScreeningQuestion[] {
  const screens = screeningDomains.flatMap((domain) =>
    screenItems(domain).map((item) => ({ domain, item })),
  )
  const extras = screeningDomains.flatMap((domain) =>
    extraItems(session, domain).map((item) => ({ domain, item })),
  )
  return [...screens, ...extras]
}

export function nextQuestion(session: ScreeningSession): ScreeningQuestion | null {
  return screeningQuestions(session).find((question) => !isAnswered(session, question)) ?? null
}

function isAnnounced(candidate: ScreeningQuestion, at: ScreeningQuestion): boolean {
  const inBlock = candidate.domain === at.domain && !screenItems(at.domain).includes(at.item)
  return inBlock || !fullFormOnly(candidate.domain).includes(candidate.item)
}

export function progressAt(
  session: ScreeningSession,
  question: ScreeningQuestion,
): ScreeningProgress {
  const questions = screeningQuestions(session)
  const index = questions.findIndex((candidate) => sameQuestion(candidate, question))
  const counted = questions.filter(
    (candidate, position) => position <= index || isAnnounced(candidate, question),
  )
  return { current: index + 1, total: counted.length }
}

export function previousQuestion(
  session: ScreeningSession,
  question: ScreeningQuestion,
): ScreeningQuestion | null {
  const questions = screeningQuestions(session)
  const index = questions.findIndex((candidate) => sameQuestion(candidate, question))
  const previous = index > 0 ? questions[index - 1] : undefined
  return previous !== undefined && session.saved[previous.domain] === undefined ? previous : null
}

export function answerQuestion(
  session: ScreeningSession,
  question: ScreeningQuestion,
  value: Answer,
): ScreeningSession {
  const { domain, item } = question
  const askable = screeningQuestions(session).some((candidate) => sameQuestion(candidate, question))
  if (session.saved[domain] !== undefined || !askable) {
    return session
  }
  const updated: ItemAnswers = { ...session.answers[domain], [item]: value }
  const next = { ...session, answers: { ...session.answers, [domain]: updated } }
  if (screenResult(next, domain) === 'positive') {
    return next
  }
  const dropped = new Set(fullFormOnly(domain))
  const kept: ItemAnswers = Object.fromEntries(
    Object.entries(updated).filter(([key]) => !dropped.has(Number(key))),
  )
  return { ...session, answers: { ...session.answers, [domain]: kept } }
}

export function recordsToSave(session: ScreeningSession): ScreeningRecord[] {
  if (!screensDone(session)) {
    return []
  }
  return screeningDomains.flatMap((domain) => {
    if (session.saved[domain] !== undefined) {
      return []
    }
    const { screen, full } = twoStepScreens[domain]
    const instrument = screenResult(session, domain) === 'positive' ? full : screen
    const answers = answersAt(session.answers[domain], instrument.items)
    return answers === null ? [] : [{ domain, instrument: instrument.id, answers }]
  })
}

export function fullFormStart(question: ScreeningQuestion): FullFormStart | null {
  const { screen, full } = twoStepScreens[question.domain]
  return question.item === fullFormOnly(question.domain)[0]
    ? { domain: question.domain, count: full.items.length - screen.scoredItems }
    : null
}

export function isScreeningComplete(session: ScreeningSession): boolean {
  return screeningDomains.every((domain) => session.saved[domain] !== undefined)
}
