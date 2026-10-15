import { pluralizer } from './plural.ts'

const plural = pluralizer('pt-BR')

export const brazilianPortuguese = {
  fileStem: 'mycogni-relatorio',
  title: 'Relatório de humor',
  lastDays: (days: number) => `Últimos ${String(days)} dias`,
  generatedOn: (date: string) => `Gerado em ${date}`,
  unnamed: 'Pessoa sem nome cadastrado',
  kpis: {
    recorded: 'Dias com registro',
    recordedValue: (count: number, days: number) => `${String(count)} de ${String(days)}`,
    recordedDetail: (count: number) =>
      plural(count, { one: '# registro no período', other: '# registros no período' }),
    average: 'Humor médio',
    averageValue: (value: string) => `${value} de 6`,
    noAverage: 'Sem registros no período',
    change: (days: number) => `Em relação aos ${String(days)} dias anteriores`,
    changes: {
      higher: 'Acima',
      slightlyHigher: 'Um pouco acima',
      similar: 'Parecido',
      slightlyLower: 'Um pouco abaixo',
      lower: 'Abaixo',
    },
    previous: (average: string) => `Média anterior: ${average}`,
    noComparison: 'Poucos dias com registro para comparar',
  },
  chart: {
    title: 'Humor por dia',
    caption:
      'Média de cada dia, de 0 (muito mal) a 6 (muito bem). Dias sem ponto não têm registro.',
    empty: 'Nenhum registro neste período.',
  },
  frequent: {
    title: 'O que mais apareceu',
    emotions: 'Emoções',
    contexts: 'Contextos',
    count: (count: number) => plural(count, { one: '# registro', other: '# registros' }),
    empty: 'Nada registrado neste período.',
  },
  screenings: {
    title: 'Questionários',
    note: 'Resultado mais recente de cada questionário no período. É uma triagem, não um diagnóstico.',
    score: (score: number, max: number) => `${String(score)} de ${String(max)}`,
    answeredOn: (date: string) => `Respondido em ${date}`,
    risk: (date: string) =>
      `Item 9 (pensamentos de morte ou autolesão) respondido acima de zero em ${date}. Avaliar o risco.`,
    empty: 'Nenhum questionário respondido neste período.',
  },
  reading: {
    title: 'Resumo do período',
    patientNotice: 'Escrito automaticamente a partir dos registros. Não é um diagnóstico.',
    professionalNotice:
      'Escrito automaticamente a partir dos registros compartilhados com você, sem o MyBook. Não faz diagnóstico.',
    covers: (period: string) => `Sobre os registros de ${period}`,
    highlights: 'O que se destacou',
    suggestions: 'Para os próximos dias',
    trends: 'Tendências',
    themes: 'Temas',
    attention: (level: string, reason: string | null) =>
      reason === null ? `Atenção: ${level}.` : `Atenção: ${level}. ${reason}`,
    attentionLevels: {
      watch: 'observar',
      urgent: 'urgente',
    },
  },
  notes: {
    title: 'Notas',
    empty: 'Nenhuma nota neste período.',
  },
  footer: {
    disclaimer:
      'Este relatório não é um diagnóstico e não substitui o acompanhamento de um profissional de saúde.',
    crisis: 'Em crise, ligue',
    page: (page: number, total: number) => `${String(page)} de ${String(total)}`,
  },
}

export type ReportMessages = typeof brazilianPortuguese
