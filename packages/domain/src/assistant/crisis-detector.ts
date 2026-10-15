import { mergeRisk, type AssistantMode, type RiskLevel } from './assistant.ts'
import {
  concernCategories,
  crisisCategories,
  crisisPhrases,
  idiomTails,
  negators,
  phraseLanguages,
  type ConcernCategory,
  type CrisisCategory,
} from './crisis-phrases.ts'

export const riskSignals = [
  ...crisisCategories,
  ...concernCategories,
  'negated_crisis',
  'earlier_crisis',
  'earlier_concern',
  'screening',
] as const

export type RiskSignal = (typeof riskSignals)[number]

export interface RiskAssessment {
  level: RiskLevel
  signals: RiskSignal[]
}

export interface ConversationRiskInput {
  message: string
  earlier: readonly string[]
  screeningRisk: boolean
}

type Tokens = readonly string[]

export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/['’`´]/g, '')
}

function tokensOf(text: string): string[] {
  return text.split(/[^\p{L}\p{N}]+/u).filter((token) => token !== '')
}

function clausesOf(text: string): Tokens[] {
  return normalizeText(text)
    .split(/[.!?;:,\n\r–—()[\]{}"“”]+/u)
    .map(tokensOf)
    .filter((tokens) => tokens.length > 0)
}

function compile<Category extends string>(
  categories: readonly Category[],
  pick: (
    language: (typeof phraseLanguages)[number],
  ) => Readonly<Record<Category, readonly string[]>>,
): [Category, Tokens][] {
  return categories.flatMap((category) =>
    phraseLanguages.flatMap((language) =>
      pick(language)[category].map((phrase): [Category, Tokens] => [
        category,
        tokensOf(normalizeText(phrase)),
      ]),
    ),
  )
}

const crisisPatterns = compile<CrisisCategory>(
  crisisCategories,
  (language) => crisisPhrases[language].crisis,
)

const concernPatterns = compile<ConcernCategory>(
  concernCategories,
  (language) => crisisPhrases[language].concern,
)

const negatorSet: ReadonlySet<string> = new Set(negators)

const idiomPatterns: Tokens[] = idiomTails.map(tokensOf)

function startsAt(tokens: Tokens, pattern: Tokens, index: number): boolean {
  return pattern.every((token, offset) => tokens[index + offset] === token)
}

function isIdiom(tokens: Tokens, end: number): boolean {
  return idiomPatterns.some((idiom) => startsAt(tokens, idiom, end))
}

type Match = 'plain' | 'negated'

function matchesIn(tokens: Tokens, pattern: Tokens): Match[] {
  return tokens.flatMap((_, index): Match[] => {
    if (!startsAt(tokens, pattern, index) || isIdiom(tokens, index + pattern.length)) {
      return []
    }
    const previous = tokens[index - 1]
    return [previous !== undefined && negatorSet.has(previous) ? 'negated' : 'plain']
  })
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)]
}

function ordered(signals: readonly RiskSignal[]): RiskSignal[] {
  return riskSignals.filter((signal) => signals.includes(signal))
}

export function messageRisk(text: string): RiskAssessment {
  const clauses = clausesOf(text)
  const crisis = crisisPatterns.flatMap(([category, pattern]) =>
    clauses.flatMap((tokens) => matchesIn(tokens, pattern).map((match) => ({ category, match }))),
  )
  const concerns = concernPatterns.flatMap(([category, pattern]) =>
    clauses.some((tokens) => matchesIn(tokens, pattern).includes('plain')) ? [category] : [],
  )
  const urgent = unique(crisis.filter((hit) => hit.match === 'plain').map((hit) => hit.category))
  const negated = crisis.some((hit) => hit.match === 'negated')
  const signals = ordered([...urgent, ...concerns, ...(negated ? ['negated_crisis' as const] : [])])
  if (urgent.length > 0) {
    return { level: 'urgent', signals }
  }
  return { level: signals.length > 0 ? 'watch' : 'none', signals }
}

export function conversationRisk({
  message,
  earlier,
  screeningRisk,
}: ConversationRiskInput): RiskAssessment {
  const current = messageRisk(message)
  const before = earlier.map((text) => messageRisk(text).level)
  const context: RiskSignal[] = [
    ...(before.includes('urgent') ? ['earlier_crisis' as const] : []),
    ...(before.filter((level) => level === 'watch').length >= 2
      ? ['earlier_concern' as const]
      : []),
    ...(screeningRisk ? ['screening' as const] : []),
  ]
  return {
    level: mergeRisk(current.level, context.length > 0 ? 'watch' : 'none'),
    signals: ordered([...current.signals, ...context]),
  }
}

export function riskForMode(level: RiskLevel, mode: AssistantMode): RiskLevel {
  return mode === 'professional' && level === 'urgent' ? 'watch' : level
}
