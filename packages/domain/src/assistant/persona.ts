import { normalizeText } from '../safety/crisis-detector.ts'

export const cogniBannedPhrases = [
  'como uma IA',
  'sou apenas um modelo',
  'ótima pergunta',
  'estou aqui para ajudar',
  'é importante lembrar que',
  'navegar',
  'jornada',
  'empoderar',
  'potencializar',
  'holístico',
  'as an AI',
  'just a language model',
  'great question',
  'I am here to help',
  'I’m here to help',
  'it is important to remember',
  'navigate',
  'journey',
  'empower',
  'holistic',
] as const

function wordsOf(text: string): string {
  return ` ${normalizeText(text)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word !== '')
    .join(' ')} `
}

export function bannedPhrasesIn(text: string): string[] {
  const words = wordsOf(text)
  return cogniBannedPhrases.filter((phrase) => words.includes(wordsOf(phrase)))
}
