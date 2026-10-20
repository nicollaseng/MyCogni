import { labelsFor } from '@mycogni/domain'

export const common = {
  meta: {
    description:
      'Diário de humor: um registro por dia e perguntas sobre ânimo e ansiedade a cada duas semanas para ver como você muda.',
  },
  navigation: {
    label: 'Navegação principal',
    today: 'Hoje',
    entries: 'Registros',
    mybook: 'MyBook',
    patterns: 'Padrões',
    zen: 'Zen',
  },
  account: {
    open: 'Sua conta',
    menu: 'Conta',
    profile: 'Perfil e configurações',
    professionals: 'Profissionais',
    support: 'Suporte',
    signOut: 'Sair',
  },
  help: {
    summary: 'Precisa de ajuda agora?',
    intro: 'Se você está em crise ou pensando em se machucar, ligue agora:',
    disclaimer: 'O MyCogniAI não substitui acompanhamento profissional.',
  },
  whatsapp: {
    list: 'WhatsApp de quem acompanha você',
    talk: 'Fale com {name} agora',
    label: 'WhatsApp',
    message:
      'Oi {name}, isso é urgente. Estou precisando de ajuda agora.\n\nMensagem enviada através do app MyCogniAI',
  },
  loading: 'Carregando',
  notFound: {
    title: 'Esta página não existe.',
    body: 'O endereço pode ter mudado ou estar incompleto.',
    back: 'Voltar ao início',
  },
  mood: {
    ...labelsFor('pt-BR').moods,
    scaleLow: 'muito mal',
    scaleHigh: 'muito bem',
  },
  professionalKinds: {
    psychologist: 'Psicologia',
    psychiatrist: 'Psiquiatria',
    physician: 'Medicina',
    psychoanalyst: 'Psicanálise',
  },
  photoOf: 'Foto de {name}',
  language: {
    label: 'Idioma',
    hint: 'O app passa a usar este idioma em todas as telas.',
  },
  outdated: {
    message: 'O app foi atualizado. Recarregue para continuar.',
    reload: 'Recarregar',
  },
}

export type CommonMessages = typeof common
