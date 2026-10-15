import { pluralizer } from './plural.ts'
import type { ReportMessages } from './pt-br.ts'

const plural = pluralizer('pt-PT')

export const europeanPortuguese: ReportMessages = {
  fileName: (day) => `mycogni-relatorio-${day}.pdf`,
  title: 'Relatório de humor',
  lastDays: (days) => `Últimos ${String(days)} dias`,
  generatedOn: (date) => `Gerado a ${date}`,
  unnamed: 'Pessoa sem nome registado',
  kpis: {
    recorded: 'Dias com registo',
    recordedValue: (count, days) => `${String(count)} de ${String(days)}`,
    recordedDetail: (count) =>
      plural(count, { one: '# registo no período', other: '# registos no período' }),
    average: 'Humor médio',
    averageValue: (value) => `${value} de 6`,
    noAverage: 'Sem registos no período',
    change: (days) => `Em relação aos ${String(days)} dias anteriores`,
    changes: {
      higher: 'Acima',
      slightlyHigher: 'Ligeiramente acima',
      similar: 'Semelhante',
      slightlyLower: 'Ligeiramente abaixo',
      lower: 'Abaixo',
    },
    previous: (average) => `Média anterior: ${average}`,
    noComparison: 'Poucos dias com registo para comparar',
  },
  chart: {
    title: 'Humor por dia',
    caption:
      'Média de cada dia, de 0 (muito mal) a 6 (muito bem). Os dias sem ponto não têm registo.',
    empty: 'Nenhum registo neste período.',
  },
  frequent: {
    title: 'O que mais apareceu',
    emotions: 'Emoções',
    contexts: 'Contextos',
    count: (count) => plural(count, { one: '# registo', other: '# registos' }),
    empty: 'Nada registado neste período.',
  },
  screenings: {
    title: 'Questionários',
    note: 'Resultado mais recente de cada questionário no período. É um rastreio, não um diagnóstico.',
    score: (score, max) => `${String(score)} de ${String(max)}`,
    answeredOn: (date) => `Respondido a ${date}`,
    empty: 'Nenhum questionário respondido neste período.',
  },
  reading: {
    title: 'Resumo do período',
    patientNotice: 'Escrito automaticamente a partir dos registos. Não é um diagnóstico.',
    professionalNotice:
      'Escrito automaticamente a partir dos registos partilhados consigo, sem o MyBook. Não faz diagnósticos.',
    covers: (period) => `Sobre os registos de ${period}`,
    highlights: 'O que se destacou',
    suggestions: 'Para os próximos dias',
    trends: 'Tendências',
    themes: 'Temas',
    attention: (level, reason) =>
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
    page: (page, total) => `${String(page)} de ${String(total)}`,
  },
}
