export const patterns = {
  meta: {
    title: 'Padrões',
  },
  title: 'Padrões',
  description: 'O que se repete nos seus registros.',
  empty: 'Seus padrões aparecem aqui conforme você registra.',
  emptyAction: 'Fazer um check-in',
  footnote: 'Mostra o que aconteceu junto, não o que causou. Não é um diagnóstico.',
  period: {
    label: 'Período',
    days: '{days} dias',
    none: 'Nenhum registro nos últimos {days} dias.',
  },
  summary: {
    title: 'Em resumo',
    average: 'Humor médio',
    near: 'Perto de “{mood}”',
    change: 'Mudança',
    changeReading: {
      higher: 'Acima dos {days} dias anteriores',
      slightlyHigher: 'Um pouco acima dos {days} dias anteriores',
      similar: 'Parecido com os {days} dias anteriores',
      slightlyLower: 'Um pouco abaixo dos {days} dias anteriores',
      lower: 'Abaixo dos {days} dias anteriores',
    },
    recorded: 'Dias com registro',
    recordedValue: '{count} de {days}',
    streak:
      '{count, plural, =0 {Sem sequência agora} one {Sequência atual: # dia} other {Sequência atual: # dias}}',
  },
  chart: {
    title: 'Seu humor',
    label: 'Humor médio de cada dia nos últimos {days} dias',
  },
  associations: {
    better: 'O que acompanha seus dias melhores',
    harder: 'O que acompanha seus dias mais difíceis',
    harderShort: 'E nos dias mais difíceis',
    title: 'O que acompanha seus dias',
    reading: 'Humor médio nos dias com e sem cada contexto.',
    with: 'com',
    without: 'sem',
    days: '{with, plural, =0 {# dias} one {# dia} other {# dias}} com, {without, plural, =0 {# dias} one {# dia} other {# dias}} sem',
    similar: 'Até agora, nenhum contexto mudou muito a média dos seus dias.',
  },
  weekdays: {
    title: 'Dias da semana',
    reading: 'Melhor dia: {best} · Mais difícil: {worst}',
    none: 'sem registro',
    row: '{weekday}: média {average} em {count, plural, =0 {# dias} one {# dia} other {# dias}}',
    days: '{count, plural, =0 {# dias} one {# dia} other {# dias}}',
  },
  frequent: {
    title: 'Emoções e contextos',
    emotions: 'Emoções',
    contexts: 'Contextos',
    count: '{count, plural, =0 {# registros} one {# registro} other {# registros}}',
    none: 'Nada marcado ainda.',
  },
  scores: {
    title: 'Ânimo e ansiedade',
    point: '{date}: {level}',
  },
  upcoming: {
    title: 'Em breve',
    sections: {
      summary: 'Resumo automático',
      weekdays: 'Dias da semana',
      frequent: 'Emoções e contextos',
      associations: 'O que acompanha seus dias',
      scores: 'Ânimo e ansiedade',
    },
    progress: {
      records: '{current} de {required} registros',
      days: '{current} de {required} dias',
      answers: '{current} de {required} respostas',
    },
    contexts: 'Marque contextos nos registros',
  },
}

export type PatternsMessages = typeof patterns
