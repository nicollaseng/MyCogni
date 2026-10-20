export const assistant = {
  launcher: 'Perguntar',
  title: 'Perguntar',
  professionalTitle: 'Perguntar sobre {name}',
  professionalAction: 'Perguntar sobre este paciente',
  close: 'Fechar',
  disclaimer: {
    mistakes: 'IA pode cometer erros.',
    personal: 'Essa conversa não substitui um aconselhamento de saúde profissional.',
    professional: 'Não substitui o seu julgamento clínico.',
  },
  toolbar: {
    new: 'Nova conversa',
    history: 'Conversas',
    historyEmpty: 'Nenhuma conversa ainda',
    untitled: 'Conversa sem texto',
    delete: 'Apagar',
    deleteQuestion: 'Apagar esta conversa? Não dá para desfazer.',
    deleteConfirm: 'Apagar conversa',
    deleteCancel: 'Cancelar',
  },
  empty: {
    personal:
      'Pergunte sobre os seus registros ou conte como você está. As respostas são curtas e ficam só com você.',
    professional:
      'Pergunte sobre tendências, contextos e questionários deste paciente. As respostas ficam só com você.',
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
