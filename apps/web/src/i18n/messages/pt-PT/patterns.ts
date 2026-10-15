import type { PatternsMessages } from '../pt-BR/patterns'

export const patterns: PatternsMessages = {
  meta: {
    title: 'Padrões',
  },
  title: 'Padrões',
  description: 'O que se repete nos seus registos.',
  empty: 'Os seus padrões aparecem aqui à medida que regista.',
  emptyAction: 'Fazer um check-in',
  footnote: 'Mostra o que aconteceu em conjunto, não o que causou o quê. Não é um diagnóstico.',
  period: {
    label: 'Período',
    days: '{days} dias',
    none: 'Nenhum registo nos últimos {days} dias.',
  },
  summary: {
    title: 'Em resumo',
    average: 'Humor médio',
    near: 'Perto de «{mood}»',
    change: 'Variação',
    changeReading: {
      higher: 'Acima dos {days} dias anteriores',
      slightlyHigher: 'Ligeiramente acima dos {days} dias anteriores',
      similar: 'Semelhante aos {days} dias anteriores',
      slightlyLower: 'Ligeiramente abaixo dos {days} dias anteriores',
      lower: 'Abaixo dos {days} dias anteriores',
    },
    recorded: 'Dias com registo',
    recordedValue: '{count} de {days}',
    streak:
      '{count, plural, =0 {Sem sequência neste momento} one {Sequência atual: # dia} other {Sequência atual: # dias}}',
  },
  chart: {
    title: 'O seu humor',
    label: 'Humor médio de cada dia nos últimos {days} dias',
  },
  associations: {
    better: 'O que acompanha os seus melhores dias',
    harder: 'O que acompanha os seus dias mais difíceis',
    harderShort: 'E nos dias mais difíceis',
    title: 'O que acompanha os seus dias',
    reading: 'Humor médio nos dias com e sem cada contexto.',
    with: 'com',
    without: 'sem',
    days: '{with, plural, one {# dia} other {# dias}} com, {without, plural, one {# dia} other {# dias}} sem',
    similar: 'Até agora, nenhum contexto alterou muito a média dos seus dias.',
  },
  weekdays: {
    title: 'Dias da semana',
    reading: 'Melhor dia: {best} · Mais difícil: {worst}',
    none: 'sem registo',
    row: '{weekday}: média {average} em {count, plural, one {# dia} other {# dias}}',
    days: '{count, plural, one {# dia} other {# dias}}',
  },
  frequent: {
    title: 'Emoções e contextos',
    emotions: 'Emoções',
    contexts: 'Contextos',
    count: '{count, plural, one {# registo} other {# registos}}',
    none: 'Ainda nada assinalado.',
  },
  scores: {
    title: 'Questionários',
    latest: 'Último: {score} de {max}, {severity}.',
    point: '{date}: {score} de {max}, {severity}',
  },
  upcoming: {
    title: 'Em breve',
    sections: {
      summary: 'Resumo automático',
      weekdays: 'Dias da semana',
      frequent: 'Emoções e contextos',
      associations: 'O que acompanha os seus dias',
      scores: 'Questionários',
    },
    progress: {
      records: '{current} de {required} registos',
      days: '{current} de {required} dias',
      answers: '{current} de {required} respostas',
    },
    contexts: 'Assinale contextos nos registos',
  },
}
