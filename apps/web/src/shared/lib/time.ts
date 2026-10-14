export const defaultTimeZone = 'America/Sao_Paulo'

export function formatLongDate(date: Date, timeZone: string): string {
  const formatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone,
  }).format(date)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}
