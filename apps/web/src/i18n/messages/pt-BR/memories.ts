export const memories = {
  meta: { title: 'Memórias' },
  lead: 'O que o Cogni lembra do que você conta, para conversar melhor com você.',
  switch: {
    label: 'Lembrar do que eu conto',
    hint: 'Desligado, o Cogni não guarda nada novo.',
  },
  add: {
    open: 'Adicionar memória',
    label: 'Nova memória',
    placeholder: 'Ex.: Caminhar me ajuda a desacelerar.',
    save: 'Salvar',
    cancel: 'Cancelar',
  },
  empty: 'Nada guardado ainda.',
  source: {
    manual: 'Adicionada por você',
    conversation: 'De uma conversa',
    checkIn: 'De um registro de {date}',
    journal: 'Do MyBook',
  },
  item: {
    edit: 'Editar',
    remove: 'Apagar',
    save: 'Salvar',
    cancel: 'Cancelar',
    label: 'Memória',
  },
  saved: 'Memórias guardadas',
  archived: 'Memórias antigas',
  clear: {
    open: 'Apagar todas',
    title: 'Apagar todas as memórias?',
    body: 'O Cogni esquece tudo o que guardou. Não dá para desfazer.',
    confirm: 'Apagar todas',
    cancel: 'Cancelar',
  },
  feedback: {
    added: 'Memória salva.',
    updated: 'Memória atualizada.',
    removed: 'Memória apagada.',
    cleared: 'Memórias apagadas.',
    on: 'O Cogni volta a lembrar do que você conta.',
    off: 'O Cogni não vai guardar nada novo.',
    tooLong: 'Use até {max} caracteres.',
    empty: 'Escreva a memória.',
    error: 'Não conseguimos salvar agora. Tente de novo em instantes.',
  },
}

export type MemoriesMessages = typeof memories
