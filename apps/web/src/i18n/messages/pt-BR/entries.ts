export const entries = {
  meta: {
    title: 'Registros',
  },
  title: 'Registros',
  description: 'Cada check-in fica guardado aqui, com a data, o humor e o que você quiser anotar.',
  empty: 'Seu primeiro registro aparece aqui.',
  emptyAction: 'Fazer o primeiro check-in',
  older: 'Registros anteriores',
  days: {
    today: 'Hoje',
    yesterday: 'Ontem',
  },
  search: {
    label: 'Buscar nos registros',
    placeholder: 'Buscar em notas e emoções',
    submit: 'Buscar',
    clear: 'Limpar busca',
  },
  filters: {
    label: 'Filtros',
    clear: 'Limpar filtros',
    period: {
      label: 'Período',
      any: 'Todo o período',
      week: 'Últimos 7 dias',
      month: 'Últimos 30 dias',
      quarter: 'Últimos 90 dias',
    },
    mood: {
      label: 'Humor',
      any: 'Qualquer humor',
      hard: 'Humor difícil',
      neutral: 'Humor neutro',
      good: 'Humor bom',
    },
    emotion: {
      label: 'Emoção',
      any: 'Todas as emoções',
      used: 'Suas mais usadas',
    },
    context: {
      label: 'Contexto',
      any: 'Todos os contextos',
      used: 'Seus mais usados',
    },
    withNote: 'Só com nota',
  },
  results: {
    reset: 'Limpar busca e filtros',
    all: '{count, plural, one {# registro} other {# registros}}',
    filtered:
      '{count, plural, =0 {Nenhum registro encontrado} one {# registro encontrado} other {# registros encontrados}}',
    none: 'Nada por aqui com essa busca e esses filtros. Tente outra palavra ou outro período.',
  },
}

export type EntriesMessages = typeof entries
