import { labelsFor } from '@mycogni/domain'
import type { CommonMessages } from '../pt-BR/common'

export const common: CommonMessages = {
  meta: {
    description:
      'Diário de humor: um registo por dia e PHQ-9 e GAD-7 a cada duas semanas para ver como a ansiedade e o humor mudam.',
  },
  navigation: {
    label: 'Navegação principal',
    today: 'Hoje',
    entries: 'Registos',
    mybook: 'MyBook',
    patterns: 'Padrões',
  },
  account: {
    open: 'A sua conta',
    menu: 'Conta',
    profile: 'Perfil e definições',
    professionals: 'Profissionais',
    help: 'Ajuda agora',
    signOut: 'Terminar sessão',
  },
  help: {
    summary: 'Precisa de ajuda agora?',
    intro: 'Se está em crise ou a pensar em magoar-se, ligue agora:',
    disclaimer: 'O MyCogniAI não substitui o acompanhamento de um profissional.',
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
}
