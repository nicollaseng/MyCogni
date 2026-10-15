export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

export function bindShortWords(text: string): string {
  return text.replace(/(?<=^|[\s(“"'«])(\p{L})[ \t]+(?=\S)/gu, '$1\u00a0')
}
