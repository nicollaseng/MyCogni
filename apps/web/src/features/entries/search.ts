import type { Choice } from '@/features/check-in/catalog'
import { normalizeText } from '@/shared/lib/text'

export const minSearchLength = 2

export function matchingTags(query: string, choices: readonly Choice[]): string[] {
  const term = normalizeText(query)
  if (term.length < minSearchLength) {
    return []
  }
  return choices
    .filter((choice) => normalizeText(choice.label).includes(term))
    .map((choice) => choice.id)
}
