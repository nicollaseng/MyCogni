import type { AssistantMessages } from '../pt-BR/assistant'

export const assistant: AssistantMessages = {
  launcher: 'Perguntar',
  title: 'Perguntar',
  professionalTitle: 'Perguntar sobre {name}',
  professionalAction: 'Perguntar sobre este paciente',
  close: 'Fechar',
  disclaimer: {
    mistakes: 'A IA pode cometer erros.',
    personal: 'Esta conversa não substitui aconselhamento de saúde profissional.',
    professional: 'Não substitui o seu juízo clínico.',
  },
  toolbar: {
    new: 'Nova conversa',
    history: 'Conversas',
    historyEmpty: 'Ainda não há conversas',
    untitled: 'Conversa sem texto',
    delete: 'Apagar',
    deleteQuestion: 'Apagar esta conversa? Não é possível desfazer.',
    deleteConfirm: 'Apagar conversa',
    deleteCancel: 'Cancelar',
  },
  empty: {
    personal:
      'Pergunte sobre os seus registos ou conte como está. As respostas são curtas e ficam só consigo.',
    professional:
      'Pergunte sobre tendências, contextos e questionários deste paciente. As respostas ficam só consigo.',
  },
  starters: {
    personal: {
      mood: 'Como esteve o meu humor nas últimas duas semanas?',
      helps: 'O que parece ajudar-me nos dias bons?',
      sleep: 'Tenho dormido mal. O que posso experimentar?',
    },
    professional: {
      trend: 'Como mudou o humor nas últimas semanas?',
      contexts: 'Que contextos aparecem nos dias mais em baixo?',
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
    user: 'Eu',
    assistant: 'MyCogniAI',
  },
  pending: 'A escrever a resposta…',
  consent: {
    title: 'Posso ler os seus registos?',
    body: 'Com a sua autorização, leio os seus check-ins, questionários, padrões e resumos para responder sobre si. Pode desligar quando quiser em Perfil e definições.',
    journal: 'Ler também o MyBook',
    allow: 'Autorizar',
    later: 'Agora não',
    saving: 'A guardar…',
  },
  noAccess: 'Sem autorização para ler os seus registos, respondo de forma geral.',
  professionalNoAccess:
    'Este paciente não autorizou o uso de IA nos seus registos. As respostas são gerais.',
  professionalSupport: {
    title: 'Sinais de risco',
    body: 'Siga o seu protocolo de segurança. Se houver risco imediato, contacte os serviços de emergência.',
  },
  errors: {
    limit: 'Enviou muitas mensagens em pouco tempo. Tente novamente mais tarde.',
    failed: 'Não foi possível enviar agora. Tente novamente dentro de instantes.',
    load: 'Não foi possível abrir as conversas agora.',
    delete: 'Não foi possível apagar agora. Tente novamente dentro de instantes.',
    consent: 'Não foi possível guardar a autorização agora.',
  },
}
