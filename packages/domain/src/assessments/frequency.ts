export const frequencyOptions = [
  { value: 0, label: 'Nenhuma vez' },
  { value: 1, label: 'Vários dias' },
  { value: 2, label: 'Mais da metade dos dias' },
  { value: 3, label: 'Quase todos os dias' },
] as const

export type Answer = (typeof frequencyOptions)[number]['value']

export function isAnswer(value: unknown): value is Answer {
  return frequencyOptions.some((option) => option.value === value)
}
