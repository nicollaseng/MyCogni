import type { EntriesMessages } from '../pt-BR/entries'

export const entries: EntriesMessages = {
  meta: {
    title: 'Registos',
  },
  title: 'Registos',
  description: 'Cada check-in fica guardado aqui, com a data, o humor e o que quiser anotar.',
  empty: 'O seu primeiro registo aparece aqui.',
  emptyAction: 'Fazer o primeiro check-in',
  older: 'Registos anteriores',
  days: {
    today: 'Hoje',
    yesterday: 'Ontem',
  },
  search: {
    label: 'Pesquisar nos registos',
    placeholder: 'Pesquisar notas e emoções',
    submit: 'Pesquisar',
    clear: 'Limpar pesquisa',
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
      used: 'As mais usadas',
    },
    context: {
      label: 'Contexto',
      any: 'Todos os contextos',
      used: 'Os mais usados',
    },
    withNote: 'Só com nota',
  },
  results: {
    reset: 'Limpar pesquisa e filtros',
    all: '{count, plural, one {# registo} other {# registos}}',
    filtered:
      '{count, plural, =0 {Nenhum registo encontrado} one {# registo encontrado} other {# registos encontrados}}',
    none: 'Não há registos com esta pesquisa e estes filtros. Experimente outra palavra ou outro período.',
  },
}
