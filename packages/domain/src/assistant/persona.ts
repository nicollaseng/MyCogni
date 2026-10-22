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

const bracketedGender = /\p{L}+\((?:a|o|as|os)\)/giu

const contactCard =
  / (contatos|contactos|contacts|numeros|numbers|servicos|services) (\p{L}+ ){0,2}(abaixo|below) /u

export function bannedPhrasesIn(text: string): string[] {
  const words = wordsOf(text)
  const phrases = cogniBannedPhrases.filter((phrase) => words.includes(wordsOf(phrase)))
  return [...phrases, ...(text.match(bracketedGender) ?? [])]
}

export function mentionsContactCard(text: string): boolean {
  return contactCard.test(wordsOf(text))
}
