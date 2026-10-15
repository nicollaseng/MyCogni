export const today = {
  meta: {
    title: 'Hoje',
  },
  title: 'Como você está agora?',
  intro: 'Leva menos de um minuto. Num dia difícil, só o humor já basta.',
  checkIn: 'Registrar como estou',
  recent: {
    title: 'Últimos {days} dias',
    average: 'Nos últimos 7 dias, seu humor médio foi {average} de 6 ({mood}).',
    change: {
      higher: 'Acima da semana anterior ({previous}).',
      slightlyHigher: 'Um pouco acima da semana anterior ({previous}).',
      similar: 'Parecido com a semana anterior ({previous}).',
      slightlyLower: 'Um pouco abaixo da semana anterior ({previous}).',
      lower: 'Abaixo da semana anterior ({previous}).',
    },
    noRecentWeek: 'Nenhum registro nos últimos 7 dias.',
    empty: 'Seus dias aparecem aqui conforme você registra.',
    recorded: '{count} de {days} dias com registro.',
    chartLabel: 'Humor médio de cada dia nos últimos {days} dias',
  },
  chart: {
    day: 'Dia',
    mood: 'Humor médio',
    noRecord: 'Sem registro',
    records: '{count, plural, one {# registro} other {# registros}}',
  },
}

export type TodayMessages = typeof today
