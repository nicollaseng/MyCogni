import type { PatternsMessages } from '../pt-BR/patterns'

export const patterns: PatternsMessages = {
  meta: {
    title: 'Padrões',
  },
  title: 'Padrões',
  description:
    'O que se repete nos seus registos dos últimos 90 dias. Mostra o que aconteceu, sem explicar causas nem fazer diagnósticos.',
  empty: 'Os seus padrões aparecem aqui depois dos primeiros registos.',
  emptyAction: 'Fazer um check-in',
  consistency: {
    title: 'Regularidade',
    recorded: 'Dias com registo nos últimos {days} dias',
    recordedValue: '{count} de {days}',
    streak: 'Sequência atual',
    streakValue: '{count, plural, =0 {Nenhum dia} one {# dia} other {# dias}}',
    stripLabel: '{count} de {days} dias com registo',
  },
  weekdays: {
    title: 'Humor por dia da semana',
    note: 'Média do humor de cada dia da semana, de 0 (muito mal) a 6 (muito bem).',
    missing:
      'Com {minimum} dias de registo, vê aqui como costuma ser cada dia da semana. {count, plural, one {Falta # dia} other {Faltam # dias}}.',
    none: 'sem registo',
    row: '{weekday}: média {average} em {count, plural, one {# dia} other {# dias}}',
    days: '{count, plural, one {# dia} other {# dias}}',
  },
  frequent: {
    title: 'O que mais aparece',
    emotions: 'Emoções',
    contexts: 'Contextos',
    count: '{count, plural, one {# registo} other {# registos}}',
    none: 'Ainda nada registado.',
    missing: 'Com {minimum} registos, vê aqui as emoções e os contextos mais frequentes.',
  },
  contexts: {
    title: 'Contextos e os seus dias',
    sentence: 'Nos dias com {context}, o seu humor médio foi {with}; sem, {without}.',
    days: '{with, plural, one {# dia} other {# dias}} com, {without, plural, one {# dia} other {# dias}} sem',
    with: 'Dias com o contexto',
    without: 'Dias sem o contexto',
    note: 'Mostra o que aconteceu nos mesmos dias, não o que causou o quê.',
    missing:
      'Ainda não é possível comparar. Um contexto tem de aparecer em pelo menos {days} dias e ficar de fora noutros {days}.',
    similar: 'Até agora, nenhum contexto alterou muito a média dos seus dias.',
  },
  scores: {
    title: 'Questionários ao longo do tempo',
    latest: 'Último: {score} de {max}, {severity}.',
    single: 'Responda novamente para ver como muda.',
    empty: 'Ainda não respondeu aos questionários.',
    note: 'As faixas mostram a intensidade dos sinais, da mais ligeira (em baixo) à mais intensa (em cima). Não são um diagnóstico.',
    point: '{date}: {score} de {max}, {severity}',
  },
}
