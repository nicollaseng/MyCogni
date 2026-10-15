import { labelsFor } from '@mycogni/domain'

export const common = {
  meta: {
    description:
      'Diário de humor: um registro por dia e PHQ-9 e GAD-7 a cada duas semanas para ver como ansiedade e humor mudam.',
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
    help: 'Ajuda agora',
    signOut: 'Sair',
  },
  help: {
    summary: 'Precisa de ajuda agora?',
    intro: 'Se você está em crise ou pensando em se machucar, ligue agora:',
    disclaimer: 'O MyCogniAI não substitui acompanhamento profissional.',
  },
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
}

export type CommonMessages = typeof common
