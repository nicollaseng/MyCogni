import type { OnboardingMessages } from '../pt-BR/onboarding'

export const onboarding: OnboardingMessages = {
  meta: {
    title: 'Primeiros passos',
  },
  header: {
    signOut: 'Terminar sessão',
    progress: 'Etapa {current} de {total}',
  },
  consents: {
    title: 'Antes de começar',
    lead: 'Vai registar como se sente, e isso são dados de saúde. Por isso, pedimos a sua autorização, ponto por ponto.',
    legend: 'Autorizações',
    adult: 'Tenho 18 anos ou mais.',
    documents:
      'Li e aceito os <terms>Termos de utilização</terms> e a <privacy>Política de privacidade</privacy>.',
    health:
      'Autorizo o tratamento dos meus registos de humor e das minhas respostas aos questionários. São dados de saúde, usados apenas para mostrar os meus padrões.',
    ai: 'Opcional: quero que a IA escreva resumos a partir dos meus registos.',
    submit: 'Concordar e continuar',
    saving: 'A guardar…',
  },
  name: {
    title: 'Como devemos chamar-lhe?',
    lead: 'É assim que a aplicação vai falar consigo. Mais ninguém o vê.',
    label: 'Nome',
    submit: 'Continuar',
    saving: 'A guardar…',
  },
  photo: {
    title: 'Quer adicionar uma fotografia?',
    lead: 'É opcional. Aparece para si e para os profissionais com quem escolher partilhar os seus registos.',
    alt: 'A sua fotografia',
    continue: 'Continuar',
    skip: 'Continuar sem fotografia',
    later: 'Pode alterar ou remover a fotografia quando quiser, no seu perfil.',
  },
  intro: {
    title: 'Dois questionários curtos',
    lead: 'O <nowrap>PHQ-9</nowrap> e o <nowrap>GAD-7</nowrap> são usados em todo o mundo para acompanhar sinais de depressão e de ansiedade. Passam a ser o seu ponto de partida.',
    facts: {
      questions: 'perguntas, uma por ecrã',
      minutes: 'minutos, mais ou menos',
      weeks: 'semanas: o período a que as perguntas se referem',
    },
    honesty: 'Não há respostas certas. Responda a pensar em como as coisas correram realmente.',
    disclaimer: 'É uma triagem, não um diagnóstico.',
    start: 'Começar',
  },
  results: {
    title: 'O seu ponto de partida.',
    lead: 'A referência para ver como vai mudando.',
    disclaimer: 'É uma triagem, não um diagnóstico. Só um profissional pode avaliar o seu caso.',
    finish: 'Começar a usar',
    finishing: 'A preparar…',
  },
  saveError: 'Não foi possível guardar agora. Tente novamente dentro de instantes.',
}
