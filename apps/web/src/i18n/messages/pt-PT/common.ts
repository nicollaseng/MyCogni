import { labelsFor } from '@mycogni/domain'
import type { CommonMessages } from '../pt-BR/common'

export const common: CommonMessages = {
  meta: {
    description:
      'Diário de humor: um registo por dia e perguntas sobre ânimo e ansiedade a cada duas semanas para ver como vai mudando.',
  },
  navigation: {
    label: 'Navegação principal',
    today: 'Hoje',
    entries: 'Registos',
    mybook: 'MyBook',
    patterns: 'Padrões',
    zen: 'Zen',
  },
  account: {
    open: 'A sua conta',
    menu: 'Conta',
    profile: 'Perfil e definições',
    professionals: 'Profissionais',
    support: 'Apoio',
    signOut: 'Terminar sessão',
  },
  help: {
    summary: 'Precisa de ajuda agora?',
    intro: 'Se está em crise ou a pensar em magoar-se, ligue agora:',
    disclaimer: 'O MyCogniAI não substitui o acompanhamento de um profissional.',
  },
  whatsapp: {
    list: 'WhatsApp de quem segue o seu caso',
    talk: 'Fale com {name} agora',
    label: 'WhatsApp',
    message:
      'Olá {name}, isto é urgente. Preciso de ajuda agora.\n\nMensagem enviada através da app MyCogniAI',
  },
  loading: 'A carregar',
  notFound: {
    title: 'Esta página não existe.',
    body: 'O endereço pode ter mudado ou estar incompleto.',
    back: 'Voltar ao início',
  },
  mood: {
    ...labelsFor('pt-PT').moods,
    scaleLow: 'muito mal',
    scaleHigh: 'muito bem',
  },
  professionalKinds: {
    psychologist: 'Psicologia',
    psychiatrist: 'Psiquiatria',
    physician: 'Medicina',
    psychoanalyst: 'Psicanálise',
  },
  photoOf: 'Fotografia de {name}',
  language: {
    label: 'Idioma',
    hint: 'A aplicação passa a usar este idioma em todos os ecrãs.',
  },
  outdated: {
    message: 'A aplicação foi atualizada. Recarregue para continuar.',
    reload: 'Recarregar',
  },
  pager: {
    label: 'Paginação',
    range: '{from}–{to} de {total}',
    single: '{position} de {total}',
    page: '{page} / {count}',
    current: 'Página {page} de {count}',
    previous: 'Página anterior',
    next: 'Página seguinte',
    size: 'Por página',
  },
}
