export const entries = {
  meta: {
    title: 'Registros',
    detail: 'Registro',
  },
  title: 'Registros',
  description: 'Cada check-in fica guardado aqui, com a data, o humor e o que você quiser anotar.',
  empty: 'Seu primeiro registro aparece aqui.',
  emptyAction: 'Fazer o primeiro check-in',
  days: {
    today: 'Hoje',
    yesterday: 'Ontem',
  },
  search: {
    label: 'Buscar nos registros',
    placeholder: 'Buscar',
    submit: 'Buscar',
    clear: 'Limpar busca',
  },
  filters: {
    open: 'Filtros',
    active: '{count, plural, =0 {nenhum ativo} one {# ativo} other {# ativos}}',
    title: 'Filtros',
    close: 'Fechar',
    clear: 'Limpar',
    show: '{count, plural, =0 {Nenhum registro} one {Ver # registro} other {Ver # registros}}',
    summary: 'Filtros em uso',
    period: {
      label: 'Período',
      any: 'Tudo',
      days: '{days} dias',
      last: 'Últimos {days} dias',
    },
    mood: {
      label: 'Humor',
      any: 'Qualquer humor',
      single: 'Humor {mood}',
      range: 'Humor {from} a {to}',
    },
    emotions: {
      label: 'Emoções',
      search: 'Buscar emoção',
      yours: 'Suas',
      none: 'Nenhuma emoção com esse nome.',
    },
    contexts: {
      label: 'Contextos',
      search: 'Buscar contexto',
      yours: 'Seus',
      none: 'Nenhum contexto com esse nome.',
    },
    withNote: 'Só com nota',
    noteSummary: 'Com nota',
  },
  results: {
    reset: 'Limpar busca e filtros',
    all: '{count, plural, =0 {# registros} one {# registro} other {# registros}}',
    filtered:
      '{count, plural, =0 {Nenhum registro encontrado} one {# registro encontrado} other {# registros encontrados}}',
    none: 'Nada por aqui com essa busca e esses filtros. Tente outra palavra ou outro período.',
  },
  detail: {
    back: 'Registros',
    open: 'Abrir registro de {when}',
    emotions: 'Emoções',
    contexts: 'Contextos',
    note: 'Nota',
    addenda: 'Escrito depois',
    writeMore: 'Escrever mais',
    label: 'O que você quer acrescentar?',
    hint: 'O registro não muda. Isto fica guardado abaixo, com a data de hoje.',
    save: 'Guardar',
    cancel: 'Cancelar',
    error: 'Não foi possível guardar. Tente de novo.',
    remaining:
      '{count, plural, =0 {Nenhum caractere restante} one {# caractere restante} other {# caracteres restantes}}',
    readOnly: 'Somente leitura. Só a pessoa pode acrescentar algo ao registro.',
  },
}

export type EntriesMessages = typeof entries
