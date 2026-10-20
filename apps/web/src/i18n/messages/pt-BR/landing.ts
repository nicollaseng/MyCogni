export const landing = {
  sections: {
    label: 'Seções',
    howItWorks: 'Como funciona',
    ai: 'Inteligência artificial',
    privacy: 'Privacidade',
    faq: 'Perguntas',
  },
  cta: {
    start: 'Começar',
    signIn: 'Entrar',
    signUp: 'Criar conta',
  },
  hero: {
    label: 'Experimente',
    kicker: 'Diário de humor',
    question: 'Como você está agora?',
    intro:
      'Arraste e veja o mapa responder. Um registro leva menos de um minuto, e a cada duas semanas algumas perguntas sobre ânimo e ansiedade mostram como você muda com o tempo.',
  },
  howItWorks: {
    title: 'Um minuto por dia, um retrato a cada duas semanas.',
    steps: {
      record: {
        title: 'Registre',
        description:
          'Arraste até o humor do momento e, se quiser, diga o que sente e o que tem a ver com isso. Leva menos de um minuto.',
      },
      answer: {
        title: 'Responda',
        description:
          'A cada duas semanas, perguntas curtas sobre ânimo e ansiedade, usadas no mundo todo.',
      },
      understand: {
        title: 'Entenda',
        description:
          'Toda semana, um resumo em linguagem simples mostra o que mudou e o que parece influenciar seus dias.',
      },
    },
    sample: {
      label: 'Exemplo de duas semanas de humor',
      caption: 'exemplo · 14 dias',
    },
    questionnaire: {
      caption: 'Desânimo · pergunta 2 de 9',
      question:
        'Nas últimas duas semanas, com que frequência você se sentiu para baixo, deprimido(a) ou sem perspectiva?',
    },
  },
  ai: {
    title: 'A IA escreve. Os números vêm de você.',
    description:
      'Toda semana, o MyCogniAI encontra padrões nos seus registros e escreve um resumo em linguagem simples, para você entender seus dias e levar para a terapia.',
    principles: {
      statistics:
        'Os padrões vêm de estatística feita nos seus registros. A IA só escreve sobre eles.',
      noDiagnosis: 'Não diagnostica e não fala de remédio.',
      crisis: 'Se aparecer sinal de risco, mostra ajuda humana na hora: CVV 188.',
      optional: 'É opcional. Você liga e desliga quando quiser.',
    },
  },
  weeklyNote: {
    caption: 'resumo da semana · 5 a 11 de outubro',
    summary:
      'Foi uma semana mais leve que a anterior. Nos cinco dias em que você dormiu sete horas ou mais, o humor ficou entre neutro e bem. Os dois dias mais difíceis vieram depois de noites curtas, e em ambos você marcou cansaço e trabalho.',
    table: 'Humor e horas de sono de cada dia da semana',
    measure: 'Medida',
    mood: 'humor',
    sleep: 'sono',
    hours: '{hours, number} h',
    days: {
      mon: 'seg',
      tue: 'ter',
      wed: 'qua',
      thu: 'qui',
      fri: 'sex',
      sat: 'sáb',
      sun: 'dom',
    },
    footnote:
      'Escrito pelo MyCogniAI a partir de 7 registros. As relações vêm dos seus dados; a IA só coloca em palavras.',
  },
  privacy: {
    title: 'Seus dados são seus.',
    description:
      'Registrar o humor é uma das coisas mais íntimas que alguém faz. O MyCogniAI foi desenhado a partir disso.',
    commitments: {
      sensitive:
        'Seus registros são dados de saúde e são tratados como sensíveis, como pede a LGPD.',
      onlyYou: 'Seus registros só aparecem para você.',
      control: 'Você exporta tudo ou apaga sua conta quando quiser. Apagar é apagar.',
      noSelling: 'Nada é vendido, nada vira anúncio, nada treina modelos de IA.',
    },
  },
  faq: {
    title: 'O que as pessoas perguntam.',
    questions: {
      therapy: {
        question: 'O MyCogniAI substitui terapia?',
        answer:
          'Não. Ele ajuda você a acompanhar como está e a chegar na consulta com dados. Diagnóstico e tratamento são com profissionais de saúde.',
      },
      instruments: {
        question: 'Que perguntas são essas?',
        answer:
          'São questionários curtos e validados, usados no Brasil e no mundo para acompanhar sinais de desânimo e de ansiedade. Eles indicam intensidade, não dão diagnóstico. Para quem quiser conferir, os nomes são PHQ-9 e GAD-7.',
      },
      ai: {
        question: 'Como a IA usa meus dados?',
        answer:
          'Os padrões são calculados com estatística sobre os seus registros. A IA recebe só esses resultados, sem seu nome ou email, e escreve um resumo em linguagem simples.',
      },
      selling: {
        question: 'Meus dados são vendidos ou usados para treinar IA?',
        answer: 'Não. Seus registros não são vendidos, não viram anúncio e não treinam modelos.',
      },
      crisis: {
        question: 'E se eu estiver em crise?',
        answer:
          'Ligue para o CVV no 188, 24 horas e gratuito, ou para o SAMU no 192. O link "Precisa de ajuda agora?" fica em todas as telas do app.',
      },
      deletion: {
        question: 'Posso apagar tudo?',
        answer:
          'Sim. Você pode exportar seus dados ou apagar sua conta a qualquer momento, e tudo é removido.',
      },
      devices: {
        question: 'Funciona no celular?',
        answer: 'Sim. Funciona no navegador do celular e do computador.',
      },
    },
  },
  closing: {
    title: 'Comece pelo dia de hoje.',
    lead: 'Leva menos de um minuto.',
  },
  footer: {
    tagline:
      'Diário de humor com perguntas sobre ânimo e ansiedade e resumos semanais escritos por IA.',
    product: 'Produto',
    help: 'Ajuda agora',
    legal: 'Legal',
    copyright: '© {year} MyCogniAI. Feito no Brasil.',
    disclaimer: 'Não é terapia nem diagnóstico. Em crise, ligue 188.',
    professionals: 'Para profissionais de saúde',
  },
}

export type LandingMessages = typeof landing
