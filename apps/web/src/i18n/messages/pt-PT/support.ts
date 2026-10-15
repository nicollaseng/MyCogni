import type { SupportMessages } from '../pt-BR/support'

export const support: SupportMessages = {
  meta: {
    new: 'Contactar o apoio',
    ticket: 'Pedido {ticket}',
  },
  subjects: {
    account: 'Conta e acesso',
    technical: 'Problema técnico',
    privacy: 'Privacidade e dados (RGPD)',
    professional: 'Profissional e ligação',
    billing: 'Pagamento e subscrição',
    suggestion: 'Sugestão',
    other: 'Outro assunto',
  },
  statuses: {
    pending: 'Pendente',
    in_progress: 'Em curso',
    closed: 'Fechado',
  },
  section: {
    title: 'Apoio',
    description:
      'Fale com a equipa do MyCogniAI sobre a sua conta, um problema na aplicação ou os seus dados.',
    mine: 'Os meus pedidos',
    empty: 'Ainda não fez nenhum pedido.',
    new: 'Novo pedido',
    open: 'Abrir pedido {ticket}',
    columns: {
      number: 'Número',
      subject: 'Assunto',
      status: 'Estado',
      createdAt: 'Aberto a',
    },
  },
  form: {
    title: 'Contactar o apoio',
    description:
      'Conte o que aconteceu. A equipa de apoio lê cada pedido e responde para o email da sua conta.',
    subject: 'Assunto',
    subjectPlaceholder: 'Escolha um assunto',
    customSubject: 'Qual é o assunto?',
    message: 'Mensagem',
    messageHint: 'Descreva o que aconteceu e, se puder, o que fez antes do problema.',
    count: '{count} de {max}',
    attachment: 'Anexo (opcional)',
    attachmentHint:
      'Fotografia até 5 MB (JPG, PNG, WebP ou HEIC) ou ficheiro até 2 MB (PDF ou TXT).',
    choose: 'Escolher ficheiro',
    another: 'Trocar ficheiro',
    remove: 'Remover',
    removeLabel: 'Remover o anexo {name}',
    privacy:
      'Não escreva palavras-passe nem dados de cartão. Só a equipa de apoio vê o seu pedido.',
    send: 'Enviar',
    sending: 'A enviar…',
    cancel: 'Cancelar',
    errors: {
      subject: 'Escolha um assunto.',
      customSubject: 'Escreva o assunto, com pelo menos 3 caracteres.',
      message: 'Escreva a mensagem, com pelo menos 10 caracteres.',
      type: 'Envie uma fotografia JPG, PNG, WebP ou HEIC, ou um ficheiro PDF ou TXT.',
      imageSize: 'A fotografia tem mais de 5 MB. Escolha uma mais pequena.',
      fileSize: 'O ficheiro tem mais de 2 MB. Escolha um mais pequeno.',
      size: 'O anexo excede o tamanho permitido.',
      convert: 'Não conseguimos ler esta fotografia. Tente enviar em JPG ou PNG.',
      limit: 'Já fez muitos pedidos hoje. Tente novamente amanhã.',
      failed: 'Não foi possível enviar agora. Tente novamente dentro de instantes.',
    },
  },
  sent: {
    title: 'Pedido {ticket} registado',
    email: 'Enviámos uma confirmação para {email}. A resposta da equipa chega por email.',
    noEmail: 'Acompanhe o estado do pedido aqui. A resposta da equipa chega por email.',
    view: 'Ver pedido',
    back: 'Voltar',
  },
  detail: {
    kicker: 'Pedido {ticket}',
    timeline: 'Progresso',
    steps: {
      pending: 'A aguardar a equipa de apoio',
      in_progress: 'Alguém da equipa assumiu o pedido',
      closed: 'Pedido encerrado',
    },
    waiting: 'Ainda não',
    message: 'A sua mensagem',
    attachment: 'Anexo',
    note: 'Mensagem da equipa',
    reply: 'A equipa de apoio responde para o email da sua conta.',
    back: 'Voltar ao apoio',
  },
}
