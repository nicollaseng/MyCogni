import type { InsightsMessages } from '../pt-BR/insights'

export const insights: InsightsMessages = {
  patient: {
    title: 'Resumo dos seus registos',
    period: '{period} · {count, plural, one {# registo} other {# registos}}',
    records: '{count, plural, one {# registo} other {# registos}}',
    highlights: 'O que se destacou',
    suggestions: 'Para os próximos dias',
    disclaimer: 'Escrito automaticamente a partir dos seus registos. Não é um diagnóstico.',
    earlier: 'Resumos anteriores',
    empty: {
      explanation:
        'A cada {threshold} registos, aparece aqui um resumo curto do que se destacou nos seus dias, com algumas sugestões. É escrito automaticamente a partir dos registos e não é um diagnóstico.',
      progress: '{count} de {threshold} registos para o primeiro resumo',
      disabled: 'Os resumos estão desativados na sua conta.',
      enable: 'Ativar no seu perfil',
    },
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
