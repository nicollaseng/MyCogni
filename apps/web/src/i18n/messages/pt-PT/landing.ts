import type { LandingMessages } from '../pt-BR/landing'

export const landing: LandingMessages = {
  sections: {
    label: 'Secções',
    howItWorks: 'Como funciona',
    ai: 'Inteligência artificial',
    privacy: 'Privacidade',
    faq: 'Perguntas',
  },
  cta: {
    start: 'Começar',
    signIn: 'Iniciar sessão',
    signUp: 'Criar conta',
  },
  hero: {
    label: 'Experimente',
    kicker: 'Diário de humor',
    question: 'Como se sente agora?',
    intro:
      'Arraste e veja o mapa responder. Um registo demora menos de um minuto e, a cada duas semanas, algumas perguntas sobre ânimo e ansiedade mostram como vai mudando ao longo do tempo.',
  },
  howItWorks: {
    title: 'Um minuto por dia, um retrato a cada duas semanas.',
    steps: {
      record: {
        title: 'Registe',
        description:
          'Arraste até ao humor do momento e, se quiser, diga o que sente e o que tem a ver com isso. Demora menos de um minuto.',
      },
      answer: {
        title: 'Responda',
        description:
          'A cada duas semanas, perguntas curtas sobre ânimo e ansiedade, usadas em todo o mundo.',
      },
      understand: {
        title: 'Compreenda',
        description:
          'Todas as semanas, um resumo em linguagem simples mostra o que mudou e o que parece influenciar os seus dias.',
      },
    },
    sample: {
      label: 'Exemplo de duas semanas de humor',
      caption: 'exemplo · 14 dias',
    },
    questionnaire: {
      caption: 'Desânimo · pergunta 2 de 9',
      question:
        'Durante os últimos 14 dias, em quantos sentiu desânimo, desalento ou falta de esperança?',
    },
  },
  ai: {
    title: 'A IA escreve. Os números vêm de si.',
    description:
      'Todas as semanas, o MyCogniAI encontra padrões nos seus registos e escreve um resumo em linguagem simples, para que compreenda os seus dias e o possa levar para a terapia.',
    principles: {
      statistics:
        'Os padrões vêm de estatística feita sobre os seus registos. A IA limita-se a escrever sobre eles.',
      noDiagnosis: 'Não faz diagnósticos e não fala de medicação.',
      crisis:
        'Se surgir um sinal de risco, mostra logo onde encontrar ajuda humana: SNS 24, 808 24 24 24.',
      optional: 'É opcional. Pode ativá-la e desativá-la quando quiser.',
    },
  },
  weeklyNote: {
    caption: 'resumo da semana · 5 a 11 de outubro',
    summary:
      'Foi uma semana mais leve do que a anterior. Nos cinco dias em que dormiu sete horas ou mais, o humor ficou entre neutro e bem. Os dois dias mais difíceis vieram depois de noites curtas e, em ambos, assinalou cansaço e trabalho.',
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
      'Escrito pelo MyCogniAI a partir de 7 registos. As relações vêm dos seus dados; a IA limita-se a pô-las em palavras.',
  },
  privacy: {
    title: 'Os seus dados são seus.',
    description:
      'Registar o humor é uma das coisas mais íntimas que alguém faz. O MyCogniAI foi concebido a partir daí.',
    commitments: {
      sensitive:
        'Os seus registos são dados de saúde e são tratados como sensíveis, como exige a LGPD, a lei brasileira de proteção de dados.',
      onlyYou: 'Os seus registos só aparecem para si.',
      control:
        'Pode exportar tudo ou eliminar a sua conta quando quiser. Eliminar é mesmo eliminar.',
      noSelling: 'Nada é vendido, nada é usado em publicidade, nada treina modelos de IA.',
    },
  },
  faq: {
    title: 'O que as pessoas perguntam.',
    questions: {
      therapy: {
        question: 'O MyCogniAI substitui a terapia?',
        answer:
          'Não. Ajuda a acompanhar como está e a chegar à consulta com dados. O diagnóstico e o tratamento cabem aos profissionais de saúde.',
      },
      instruments: {
        question: 'Que perguntas são estas?',
        answer:
          'São questionários curtos e validados, usados em Portugal e em todo o mundo para acompanhar sinais de desânimo e de ansiedade. Indicam a intensidade, não fazem diagnóstico. Para quem quiser confirmar, chamam-se PHQ-9 e GAD-7.',
      },
      ai: {
        question: 'Como é que a IA usa os meus dados?',
        answer:
          'Os padrões são calculados com estatística sobre os seus registos. A IA recebe apenas esses resultados, sem o seu nome nem email, e escreve um resumo em linguagem simples.',
      },
      selling: {
        question: 'Os meus dados são vendidos ou usados para treinar IA?',
        answer:
          'Não. Os seus registos não são vendidos, não são usados em publicidade e não treinam modelos.',
      },
      crisis: {
        question: 'E se eu estiver em crise?',
        answer:
          'Ligue para o SNS\u00a024 através do 808\u00a024\u00a024\u00a024 (opção 4, aconselhamento psicológico, 24 horas) ou, em caso de emergência, para o 112. A opção "Precisa de ajuda agora?" está em todos os ecrãs da aplicação.',
      },
      deletion: {
        question: 'Posso eliminar tudo?',
        answer:
          'Sim. Pode exportar os seus dados ou eliminar a sua conta a qualquer momento, e tudo é removido.',
      },
      devices: {
        question: 'Funciona no telemóvel?',
        answer: 'Sim. Funciona no navegador do telemóvel e do computador.',
      },
    },
  },
  closing: {
    title: 'Comece pelo dia de hoje.',
    lead: 'Demora menos de um minuto.',
  },
  footer: {
    tagline:
      'Diário de humor com perguntas sobre ânimo e ansiedade e resumos semanais escritos por IA.',
    product: 'Produto',
    help: 'Ajuda agora',
    legal: 'Legal',
    copyright: '© {year} MyCogniAI. Feito no Brasil.',
    disclaimer: 'Não é terapia nem diagnóstico. Em crise, ligue 808\u00a024\u00a024\u00a024.',
    professionals: 'Para profissionais de saúde',
  },
}
