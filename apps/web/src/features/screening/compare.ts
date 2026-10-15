import type { Assessment } from '@mycogni/contracts'

function shortDate(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', timeZone }).format(
    new Date(iso),
  )
}

export function comparedTo(current: Assessment, previous: Assessment, timeZone: string): string {
  const difference = current.totalScore - previous.totalScore
  const day = shortDate(previous.completedAt, timeZone)
  if (difference === 0) {
    return `Igual a ${day}`
  }
  const points = Math.abs(difference) === 1 ? 'ponto' : 'pontos'
  return `${String(Math.abs(difference))} ${points} ${difference > 0 ? 'a mais' : 'a menos'} que em ${day}`
}
