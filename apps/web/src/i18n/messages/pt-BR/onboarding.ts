export const onboarding = {
  meta: {
    title: 'Primeiros passos',
  },
  header: {
    signOut: 'Sair',
    progress: 'Etapa {current} de {total}',
  },
  consents: {
    title: 'Antes de começar',
    lead: 'Você vai registrar como se sente, e isso é dado de saúde. Por isso pedimos sua permissão, item por item.',
    legend: 'Permissões',
    adult: 'Tenho 18 anos ou mais.',
    documents:
      'Li e aceito os <terms>Termos de uso</terms> e a <privacy>Política de privacidade</privacy>.',
    health:
      'Autorizo o tratamento dos meus registros de humor e das minhas respostas aos questionários. São dados de saúde, usados só para mostrar meus padrões.',
    ai: 'Opcional: quero que a IA escreva resumos a partir dos meus registros.',
    submit: 'Concordar e continuar',
    saving: 'Salvando…',
  },
  name: {
    title: 'Como podemos te chamar?',
    lead: 'É assim que o app vai falar com você. Aparece só para você.',
    label: 'Nome',
    submit: 'Continuar',
    saving: 'Salvando…',
  },
  photo: {
    title: 'Quer adicionar uma foto?',
    lead: 'É opcional. Aparece para você e para os profissionais com quem você escolher compartilhar seus registros.',
    alt: 'Sua foto',
    continue: 'Continuar',
    skip: 'Continuar sem foto',
    later: 'Dá para trocar ou remover a foto quando quiser, em Você.',
  },
  intro: {
    title: 'Dois questionários curtos',
    lead: 'O <nowrap>PHQ-9</nowrap> e o <nowrap>GAD-7</nowrap> são usados no mundo todo para acompanhar sinais de depressão e de ansiedade. Eles viram o seu ponto de partida.',
    facts: {
      questions: 'perguntas, uma por tela',
      minutes: 'minutos, mais ou menos',
      weeks: 'semanas: o período que as perguntas cobrem',
    },
    honesty: 'Não existe resposta certa. Responda pensando em como as coisas foram de verdade.',
    disclaimer: 'É uma triagem, não um diagnóstico.',
    start: 'Começar',
  },
  results: {
    title: 'Seu ponto de partida.',
    lead: 'A referência para ver como você muda.',
    disclaimer: 'É uma triagem, não um diagnóstico. Só um profissional pode avaliar o seu caso.',
    finish: 'Começar a usar',
    finishing: 'Preparando…',
  },
  saveError: 'Não conseguimos salvar agora. Tente de novo em instantes.',
}

export type OnboardingMessages = typeof onboarding
