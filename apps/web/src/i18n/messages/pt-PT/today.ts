import type { TodayMessages } from '../pt-BR/today'

export const today: TodayMessages = {
  meta: {
    title: 'Hoje',
  },
  title: 'Como se sente agora?',
  intro: 'Demora menos de um minuto. Num dia difícil, basta registar o humor.',
  checkIn: 'Registar como estou',
  recent: {
    title: 'Últimos {days} dias',
    emptyLabel: 'Nenhum dia registado nos últimos {days} dias',
    label: 'Humor de {count} dos últimos {days} dias',
    emptyHint: 'Os seus dias aparecem aqui à medida que os regista.',
    summary: '{count} de {days} dias com registo.',
  },
  screeningDue:
    '{count, plural, one {Já passou # dia} other {Já passaram # dias}}. Refazer os questionários',
}
