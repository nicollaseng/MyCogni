export const answerValues = [0, 1, 2, 3] as const

export type Answer = (typeof answerValues)[number]

export function isAnswer(value: unknown): value is Answer {
  return answerValues.some((answer) => answer === value)
}
