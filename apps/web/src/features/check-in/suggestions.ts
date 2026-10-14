import { emotionFamilies, type ChoiceGroup, type EmotionFamily } from './catalog'

const suggestionShape = [3, 3, 2] as const

export function familiesByCloseness(valence: number): EmotionFamily[] {
  return [...emotionFamilies].sort(
    (first, second) => Math.abs(first.valence - valence) - Math.abs(second.valence - valence),
  )
}

export function suggestEmotions(valence: number): string[] {
  const ranked = familiesByCloseness(valence)
  return suggestionShape.flatMap((count, index) => ranked[index]?.items.slice(0, count) ?? [])
}

export function emotionTabs(valence: number): ChoiceGroup[] {
  return [
    { id: 'suggestions', title: 'sugestões', items: suggestEmotions(valence) },
    ...familiesByCloseness(valence),
  ]
}
