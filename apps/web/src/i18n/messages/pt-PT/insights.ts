import type { InsightsMessages } from '../pt-BR/insights'

export const insights: InsightsMessages = {
  patient: {
    digest: 'Resumo automático',
    open: 'Ler resumo',
    close: 'Fechar resumo',
    period: '{period} · {count, plural, one {# registo} other {# registos}}',
    records: '{count, plural, one {# registo} other {# registos}}',
    highlights: 'O que se destacou',
    suggestions: 'Para os próximos dias',
    earlier: 'Resumos anteriores',
  },
  teaser: {
    title: 'O seu último resumo',
    open: 'Ler o resumo completo',
  },
  professional: {
    title: 'Resumos',
    note: 'Escritos automaticamente a partir dos registos partilhados consigo, sem o MyBook. Não fazem diagnósticos.',
    empty:
      'Ainda não há resumos deste paciente. É escrito um resumo a cada {threshold} registos, se a pessoa tiver ativado os resumos na conta.',
    period: '{period} · {count, plural, one {# registo} other {# registos}}',
    attention: {
      none: 'Sem sinais de atenção',
      watch: 'Observar',
      urgent: 'Urgente',
    },
    records: '{count, plural, one {# registo} other {# registos}}',
    trends: 'Tendências',
    themes: 'Temas',
    nothing: 'Nada a destacar.',
    earlier: 'Resumos anteriores',
    columns: {
      period: 'Período',
      attention: 'Atenção',
      records: 'Registos',
    },
  },
}
