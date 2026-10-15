export const today = {
  meta: {
    title: 'Hoje',
  },
  title: 'Como você está agora?',
  intro: 'Leva menos de um minuto. Num dia difícil, só o humor já basta.',
  checkIn: 'Registrar como estou',
  recent: {
    title: 'Últimos {days} dias',
    emptyLabel: 'Nenhum dia registrado nos últimos {days} dias',
    label: 'Humor de {count} dos últimos {days} dias',
    emptyHint: 'Seus dias aparecem aqui conforme você registra.',
    summary: '{count} de {days} dias com registro.',
  },
  screeningDue:
    '{count, plural, one {Já faz # dia} other {Já faz # dias}}. Refazer os questionários',
}

export type TodayMessages = typeof today
