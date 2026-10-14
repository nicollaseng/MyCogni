import type { MoodLevel } from '@/features/mood/mood-levels'

export const sections = {
  howItWorks: 'como-funciona',
  ai: 'ia',
  privacy: 'privacidade',
  faq: 'perguntas',
} as const

export const sectionLinks = [
  { id: sections.howItWorks, label: 'Como funciona' },
  { id: sections.ai, label: 'Inteligência artificial' },
  { id: sections.privacy, label: 'Privacidade' },
  { id: sections.faq, label: 'Perguntas' },
] as const

export const sampleFortnight: readonly MoodLevel[] = [2, 3, 3, 4, 2, 1, 3, 4, 4, 5, 3, 4, 5, 4]

export interface WeekDay {
  day: string
  mood: MoodLevel
  sleepHours: number
}

export const sampleWeek: readonly WeekDay[] = [
  { day: 'seg', mood: 4, sleepHours: 7.5 },
  { day: 'ter', mood: 3, sleepHours: 7 },
  { day: 'qua', mood: 1, sleepHours: 5 },
  { day: 'qui', mood: 4, sleepHours: 8 },
  { day: 'sex', mood: 5, sleepHours: 7.5 },
  { day: 'sáb', mood: 1, sleepHours: 4.5 },
  { day: 'dom', mood: 4, sleepHours: 7 },
]

export const aiPrinciples: readonly string[] = [
  'Os padrões vêm de estatística feita nos seus registros. A IA só escreve sobre eles.',
  'Não diagnostica e não fala de remédio.',
  'Se aparecer sinal de risco, mostra ajuda humana na hora: CVV\u00a0188.',
  'É opcional. Você liga e desliga quando quiser.',
]

export const privacyCommitments: readonly string[] = [
  'Seus registros são dados de saúde e são tratados como sensíveis, como pede a LGPD.',
  'Seus registros só aparecem para você.',
  'Você exporta tudo ou apaga sua conta quando quiser. Apagar é apagar.',
  'Nada é vendido, nada vira anúncio, nada treina modelos de IA.',
]

export interface Question {
  question: string
  answer: string
}

export const questions: readonly Question[] = [
  {
    question: 'O MyCogniAI substitui terapia?',
    answer:
      'Não. Ele ajuda você a acompanhar como está e a chegar na consulta com dados. Diagnóstico e tratamento são com profissionais de saúde.',
  },
  {
    question: 'O que são o PHQ-9 e o GAD-7?',
    answer:
      'São questionários curtos e validados, usados no Brasil e no mundo para rastrear sinais de depressão (PHQ-9) e de ansiedade (GAD-7). Eles indicam intensidade, não dão diagnóstico.',
  },
  {
    question: 'Como a IA usa meus dados?',
    answer:
      'Os padrões são calculados com estatística sobre os seus registros. A IA recebe só esses resultados, sem seu nome ou email, e escreve um resumo em linguagem simples.',
  },
  {
    question: 'Meus dados são vendidos ou usados para treinar IA?',
    answer: 'Não. Seus registros não são vendidos, não viram anúncio e não treinam modelos.',
  },
  {
    question: 'E se eu estiver em crise?',
    answer:
      'Ligue para o CVV no 188, 24 horas e gratuito, ou para o SAMU no 192. O link "Precisa de ajuda agora?" fica em todas as telas do app.',
  },
  {
    question: 'Posso apagar tudo?',
    answer:
      'Sim. Você pode exportar seus dados ou apagar sua conta a qualquer momento, e tudo é removido.',
  },
  {
    question: 'Funciona no celular?',
    answer: 'Sim. Funciona no navegador do celular e do computador.',
  },
]
