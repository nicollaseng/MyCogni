import type { MemoriesMessages } from '../pt-BR/memories'

export const memories: MemoriesMessages = {
  meta: { title: 'Memórias' },
  lead: 'O que o Cogni guarda do que conta, para conversar melhor consigo.',
  switch: {
    label: 'Lembrar o que conto',
    hint: 'Desligado, o Cogni não guarda nada de novo.',
  },
  add: {
    open: 'Adicionar memória',
    label: 'Nova memória',
    placeholder: 'Ex.: Caminhar ajuda-me a abrandar.',
    save: 'Guardar',
    cancel: 'Cancelar',
  },
  empty: 'Ainda não há nada guardado.',
  source: {
    manual: 'Adicionada por si',
    conversation: 'De uma conversa',
    checkIn: 'De um registo de {date}',
    journal: 'Do MyBook',
  },
  item: {
    edit: 'Editar',
    remove: 'Apagar',
    save: 'Guardar',
    cancel: 'Cancelar',
    label: 'Memória',
  },
  saved: 'Memórias guardadas',
  archived: 'Memórias antigas',
  clear: {
    open: 'Apagar todas',
    title: 'Apagar todas as memórias?',
    body: 'O Cogni esquece tudo o que guardou. Não é possível desfazer.',
    confirm: 'Apagar todas',
    cancel: 'Cancelar',
  },
  feedback: {
    added: 'Memória guardada.',
    updated: 'Memória atualizada.',
    removed: 'Memória apagada.',
    cleared: 'Memórias apagadas.',
    on: 'O Cogni volta a lembrar o que conta.',
    off: 'O Cogni não vai guardar nada de novo.',
    tooLong: 'Use até {max} caracteres.',
    empty: 'Escreva a memória.',
    error: 'Não foi possível guardar agora. Tente novamente dentro de momentos.',
  },
}
