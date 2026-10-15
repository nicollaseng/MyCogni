import type {
  Locale,
  SupportRequesterRole,
  SupportSubject,
  SupportTicketStatus,
} from '@mycogni/domain'

type Ticket = (label: string) => string

interface StatusCopy {
  subject: Ticket
  body: string
}

export interface SupportEmailCopy {
  subjects: Readonly<Record<SupportSubject, string>>
  statuses: Readonly<Record<SupportTicketStatus, string>>
  subjectLabel: string
  statusLabel: string
  action: string
  reply: string
  created: StatusCopy & { next: string }
  inProgress: StatusCopy
  closed: StatusCopy & { note: string; again: string }
}

const english: SupportEmailCopy = {
  subjects: {
    account: 'Account and sign-in',
    technical: 'Technical problem',
    privacy: 'Privacy and data',
    professional: 'Professionals and care links',
    billing: 'Payment and subscription',
    suggestion: 'Suggestion',
    other: 'Something else',
  },
  statuses: { pending: 'Pending', in_progress: 'In progress', closed: 'Closed' },
  subjectLabel: 'Subject',
  statusLabel: 'Status',
  action: 'View ticket',
  reply: 'To add anything, reply to this email.',
  created: {
    subject: (ticket) => `We received your ticket ${ticket}`,
    body: 'Your ticket is open and pending, waiting for the support team.',
    next: 'We will email you when someone from the team takes it.',
  },
  inProgress: {
    subject: (ticket) => `Your ticket ${ticket} is in progress`,
    body: 'Someone from the support team took your ticket and will answer by email.',
  },
  closed: {
    subject: (ticket) => `Your ticket ${ticket} was closed`,
    body: 'The support team closed your ticket.',
    note: 'Message from the team',
    again: 'If you still need help, open a new ticket in the app.',
  },
}

export const supportEmailCopies: Readonly<Record<Locale, SupportEmailCopy>> = {
  'pt-BR': {
    subjects: {
      account: 'Conta e acesso',
      technical: 'Problema técnico',
      privacy: 'Privacidade e dados (LGPD)',
      professional: 'Profissional e vínculo',
      billing: 'Pagamento e assinatura',
      suggestion: 'Sugestão',
      other: 'Outro assunto',
    },
    statuses: { pending: 'Pendente', in_progress: 'Em andamento', closed: 'Fechado' },
    subjectLabel: 'Assunto',
    statusLabel: 'Situação',
    action: 'Ver chamado',
    reply: 'Para acrescentar alguma informação, responda a este email.',
    created: {
      subject: (ticket) => `Recebemos seu chamado ${ticket}`,
      body: 'Seu chamado foi aberto e está pendente, aguardando a equipe de suporte.',
      next: 'Avisaremos por email quando alguém da equipe assumir o atendimento.',
    },
    inProgress: {
      subject: (ticket) => `Seu chamado ${ticket} está em andamento`,
      body: 'Alguém da equipe de suporte assumiu seu chamado e vai responder por email.',
    },
    closed: {
      subject: (ticket) => `Seu chamado ${ticket} foi fechado`,
      body: 'A equipe de suporte encerrou seu chamado.',
      note: 'Mensagem da equipe',
      again: 'Se ainda precisar de ajuda, abra um novo chamado pelo app.',
    },
  },
  'pt-PT': {
    subjects: {
      account: 'Conta e acesso',
      technical: 'Problema técnico',
      privacy: 'Privacidade e dados (RGPD)',
      professional: 'Profissional e ligação',
      billing: 'Pagamento e subscrição',
      suggestion: 'Sugestão',
      other: 'Outro assunto',
    },
    statuses: { pending: 'Pendente', in_progress: 'Em curso', closed: 'Fechado' },
    subjectLabel: 'Assunto',
    statusLabel: 'Estado',
    action: 'Ver pedido',
    reply: 'Para acrescentar alguma informação, responda a este email.',
    created: {
      subject: (ticket) => `Recebemos o seu pedido ${ticket}`,
      body: 'O seu pedido foi registado e está pendente, a aguardar a equipa de apoio.',
      next: 'Avisamos por email quando alguém da equipa assumir o pedido.',
    },
    inProgress: {
      subject: (ticket) => `O seu pedido ${ticket} está em curso`,
      body: 'Alguém da equipa de apoio assumiu o seu pedido e vai responder por email.',
    },
    closed: {
      subject: (ticket) => `O seu pedido ${ticket} foi fechado`,
      body: 'A equipa de apoio encerrou o seu pedido.',
      note: 'Mensagem da equipa',
      again: 'Se ainda precisar de ajuda, abra um novo pedido na aplicação.',
    },
  },
  'en-US': english,
  'en-GB': english,
}

export const supportInboxCopy = {
  subject: (ticket: string, topic: string) => `Chamado ${ticket} · ${topic}`,
  title: (ticket: string) => `Novo chamado ${ticket}`,
  rows: {
    subject: 'Assunto',
    name: 'Nome',
    email: 'Email',
    role: 'Perfil',
    locale: 'Idioma',
    attachment: 'Anexo',
  },
  roles: {
    patient: 'Paciente',
    professional: 'Profissional',
  } satisfies Record<SupportRequesterRole, string>,
  noName: 'Sem nome',
  noEmail: 'Sem email',
  noAttachment: 'Sem anexo',
  message: 'Mensagem',
  action: 'Abrir no painel',
  reply: 'Responda a este email para falar diretamente com a pessoa.',
}
