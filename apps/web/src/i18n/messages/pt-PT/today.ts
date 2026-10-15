import type { TodayMessages } from '../pt-BR/today'

export const today: TodayMessages = {
  meta: {
    title: 'Hoje',
  },
  title: 'Como se sente agora?',
  intro: 'Demora menos de um minuto. Num dia difícil, basta registar o humor.',
  checkIn: 'Registar como estou',
  writeMyBook: 'Escrever no MyBook',
  recent: {
    title: 'Últimos {days} dias',
    average: 'Nos últimos 7 dias, o seu humor médio foi {average} em 6 ({mood}).',
    change: {
      higher: 'Acima da semana anterior ({previous}).',
      slightlyHigher: 'Ligeiramente acima da semana anterior ({previous}).',
      similar: 'Semelhante à semana anterior ({previous}).',
      slightlyLower: 'Ligeiramente abaixo da semana anterior ({previous}).',
      lower: 'Abaixo da semana anterior ({previous}).',
    },
    noRecentWeek: 'Nenhum registo nos últimos 7 dias.',
    empty: 'Os seus dias aparecem aqui à medida que os regista.',
    recorded: '{count} de {days} dias com registo.',
    chartLabel: 'Humor médio de cada dia nos últimos {days} dias',
  },
  chart: {
    day: 'Dia',
    mood: 'Humor médio',
    noRecord: 'Sem registo',
    records: '{count, plural, one {# registo} other {# registos}}',
  },
}
