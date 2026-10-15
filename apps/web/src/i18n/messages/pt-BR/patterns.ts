export const patterns = {
  meta: {
    title: 'Padrões',
  },
  title: 'Padrões',
  description:
    'O que se repete nos seus registros dos últimos 90 dias. Mostra o que aconteceu, sem explicar causas nem fazer diagnóstico.',
  empty: 'Seus padrões aparecem aqui depois dos primeiros registros.',
  emptyAction: 'Fazer um check-in',
  consistency: {
    title: 'Constância',
    recorded: 'Dias com registro nos últimos {days} dias',
    recordedValue: '{count} de {days}',
    streak: 'Sequência atual',
    streakValue: '{count, plural, =0 {Nenhum dia} one {# dia} other {# dias}}',
    stripLabel: '{count} de {days} dias com registro',
  },
  weekdays: {
    title: 'Humor por dia da semana',
    note: 'Média do humor de cada dia da semana, de 0 (muito mal) a 6 (muito bem).',
    missing:
      'Com {minimum} dias de registro, você vê aqui como cada dia da semana costuma ser. {count, plural, one {Falta # dia} other {Faltam # dias}}.',
    none: 'sem registro',
    row: '{weekday}: média {average} em {count, plural, one {# dia} other {# dias}}',
    days: '{count, plural, one {# dia} other {# dias}}',
  },
  frequent: {
    title: 'O que mais aparece',
    emotions: 'Emoções',
    contexts: 'Contextos',
    count: '{count, plural, one {# registro} other {# registros}}',
    none: 'Nada registrado ainda.',
    missing: 'Com {minimum} registros, você vê aqui as emoções e os contextos mais frequentes.',
  },
  contexts: {
    title: 'Contextos e seus dias',
    sentence: 'Nos dias com {context}, seu humor médio foi {with}; sem, {without}.',
    days: '{with, plural, one {# dia} other {# dias}} com, {without, plural, one {# dia} other {# dias}} sem',
    with: 'Dias com o contexto',
    without: 'Dias sem o contexto',
    note: 'Mostra o que aconteceu nos mesmos dias, não o que causou o quê.',
    missing:
      'Ainda não dá para comparar. Um contexto precisa aparecer em pelo menos {days} dias e ficar de fora em outros {days}.',
    similar: 'Até agora, nenhum contexto mudou muito a média dos seus dias.',
  },
  scores: {
    title: 'Questionários ao longo do tempo',
    latest: 'Último: {score} de {max}, {severity}.',
    single: 'Responda de novo para ver como muda.',
    empty: 'Você ainda não respondeu os questionários.',
    note: 'As faixas mostram a intensidade dos sinais, da mais leve (embaixo) à mais intensa (em cima). Não são um diagnóstico.',
    point: '{date}: {score} de {max}, {severity}',
  },
}

export type PatternsMessages = typeof patterns
