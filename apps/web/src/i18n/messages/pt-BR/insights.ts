export const insights = {
  patient: {
    digest: 'Resumo automático',
    open: 'Ler resumo',
    close: 'Fechar resumo',
    period: '{period} · {count, plural, =0 {# registros} one {# registro} other {# registros}}',
    records: '{count, plural, =0 {# registros} one {# registro} other {# registros}}',
    highlights: 'O que se destacou',
    suggestions: 'Para os próximos dias',
    earlier: 'Resumos anteriores',
  },
  teaser: {
    title: 'Seu último resumo',
    open: 'Ler o resumo completo',
  },
  professional: {
    title: 'Resumos',
    note: 'Escritos automaticamente a partir dos registros compartilhados com você, sem o MyBook. Não fazem diagnóstico.',
    empty:
      'Ainda não há resumos deste paciente. Um resumo é escrito a cada {threshold} registros, se a pessoa ativou os resumos na conta dela.',
    period: '{period} · {count, plural, =0 {# registros} one {# registro} other {# registros}}',
    attention: {
      none: 'Sem sinais de atenção',
      watch: 'Observar',
      urgent: 'Urgente',
    },
    records: '{count, plural, =0 {# registros} one {# registro} other {# registros}}',
    trends: 'Tendências',
    themes: 'Temas',
    nothing: 'Nada a destacar.',
    earlier: 'Resumos anteriores',
    columns: {
      period: 'Período',
      attention: 'Atenção',
      records: 'Registros',
    },
  },
}

export type InsightsMessages = typeof insights
