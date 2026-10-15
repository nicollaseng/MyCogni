import type { AdminMessages } from '../pt-BR/admin'

export const admin: AdminMessages = {
  shell: {
    team: 'Equipa MyCogniAI',
  },
  professionals: {
    title: 'Profissionais',
    description:
      'Abra o comprovativo e confirme o nome e a inscrição antes de aprovar. Só profissionais verificados podem convidar pacientes.',
    tabs: {
      label: 'Estado do registo',
      pending: 'A aguardar',
      verified: 'Verificados',
      rejected: 'Recusados',
    },
    columns: {
      name: 'Nome',
      kind: 'Profissão',
      registration: 'Inscrição',
      email: 'Email',
      document: 'Comprovativo',
      createdAt: 'Registo',
      actions: 'Ações',
    },
    empty: {
      pending: 'Nenhum registo a aguardar verificação.',
      verified: 'Ainda não há profissionais verificados.',
      rejected: 'Nenhum registo recusado.',
    },
    kind: 'Profissão',
    registration: 'Inscrição',
    noRegistration: 'Sem inscrição',
    email: 'Email',
    noEmail: 'Sem email',
    createdAt: 'Registo a {date}',
    reviewedAt: 'Revisto a {date}',
    document: {
      open: 'Abrir',
      openLabel: 'Abrir comprovativo de {name} num novo separador',
      missing: 'A aguardar envio',
    },
    rejectForm: {
      label: 'Motivo da recusa para {name}',
      hint: 'O profissional lê esta mensagem. Indique o que precisa de ser corrigido.',
      confirm: 'Confirmar recusa',
      cancel: 'Cancelar',
      required: 'Escreva o motivo, com pelo menos 3 caracteres.',
    },
    note: 'Motivo: {note}',
    approve: 'Aprovar',
    reject: 'Recusar',
    approved: 'Registo de {name} aprovado.',
    rejected: 'Registo de {name} recusado.',
    error: 'Não foi possível guardar a revisão agora. Tente novamente dentro de instantes.',
  },
}
