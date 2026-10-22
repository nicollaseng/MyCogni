export const assistant = {
  launcher: 'Conversar',
  launcherLabel: 'Conversar com o Cogni',
  title: 'Perguntar',
  professionalAction: 'Perguntar sobre este paciente',
  professionalContext: 'Sobre {name}',
  close: 'Fechar',
  disclaimer: {
    mistakes: 'IA pode cometer erros',
    personal: 'MyCogniAI não substitui um aconselhamento de saúde profissional.',
    professional: 'MyCogniAI não substitui o seu julgamento clínico.',
  },
  header: {
    history: 'Conversas',
    new: 'Nova conversa',
  },
  history: {
    title: 'Conversas',
    back: 'Voltar',
    empty: 'Suas conversas aparecem aqui.',
    untitled: 'Conversa sem texto',
    more: 'Mais opções para {title}',
    delete: 'Apagar',
    deleteTitle: 'Apagar esta conversa?',
    deleteBody: '“{title}” sai do histórico. Não dá para desfazer.',
    deleteConfirm: 'Apagar',
    deleteCancel: 'Cancelar',
    groups: {
      today: 'Hoje',
      yesterday: 'Ontem',
      week: 'Esta semana',
      older: 'Mais antigas',
    },
  },
  empty: {
    personal:
      'Pergunte sobre os seus registros ou conte como você está. As respostas são curtas e ficam só com você.',
    professional:
      'Pergunte sobre tendências, contextos e questionários deste paciente. As respostas ficam só com você.',
  },
  page: {
    context: 'Sobre esta página',
    suggestions: 'Sugestões para esta página',
    starters: {
      continue: 'Me ajude a continuar',
      feeling: 'O que este texto diz sobre como estou?',
      summary: 'Resuma esta página',
    },
  },
  starters: {
    personal: {
      mood: 'Como foi meu humor nas últimas duas semanas?',
      helps: 'O que parece me ajudar nos dias bons?',
      sleep: 'Tenho dormido mal. O que posso tentar?',
    },
    professional: {
      trend: 'Como o humor mudou nas últimas semanas?',
      contexts: 'Quais contextos aparecem nos dias mais baixos?',
      screenings: 'O que mudou no PHQ-9 e no GAD-7?',
    },
  },
  composer: {
    label: 'Mensagem',
    placeholder: 'Escreva aqui',
    send: 'Enviar',
    count: '{count} de {max}',
  },
  roles: {
    user: 'Você',
    assistant: 'MyCogniAI',
  },
  pending: 'Escrevendo a resposta…',
  consent: {
    title: 'Posso ler os seus registros?',
    body: 'Com a sua permissão, leio os seus check-ins, questionários, padrões e resumos para responder sobre você. Dá para desligar quando quiser em Perfil e configurações.',
    journal: 'Ler também o MyBook',
    allow: 'Permitir',
    later: 'Agora não',
    saving: 'Salvando…',
  },
  noAccess: 'Sem permissão para ler os seus registros, eu respondo de forma geral.',
  professionalNoAccess:
    'Este paciente não autorizou o uso de IA nos registros dele. As respostas são gerais.',
  professionalSupport: {
    title: 'Sinais de risco',
    body: 'Siga o seu protocolo de segurança. Se houver risco imediato, acione os serviços de emergência.',
  },
  errors: {
    limit: 'Você mandou muitas mensagens em pouco tempo. Tente de novo mais tarde.',
    failed: 'Não deu para enviar agora. Tente de novo em instantes.',
    load: 'Não deu para abrir as conversas agora.',
    delete: 'Não deu para apagar agora. Tente de novo em instantes.',
    consent: 'Não deu para salvar a permissão agora.',
  },
}

export type AssistantMessages = typeof assistant
