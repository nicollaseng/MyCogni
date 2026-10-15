import type { AdminMessages } from '../pt-BR/admin'

export const admin: AdminMessages = {
  shell: {
    team: 'Equipa MyCogniAI',
  },
  professionals: {
    title: 'Profissionais',
    description:
      'Confirme o nome e a inscrição na ordem antes de aprovar. Só profissionais verificados podem convidar pacientes.',
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
    approve: 'Aprovar',
    reject: 'Recusar',
    approved: 'Registo de {name} aprovado.',
    rejected: 'Registo de {name} recusado.',
    error: 'Não foi possível guardar a revisão agora. Tente novamente dentro de instantes.',
  },
}
