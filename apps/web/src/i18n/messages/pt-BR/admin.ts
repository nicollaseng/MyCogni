export const admin = {
  shell: {
    team: 'Equipe MyCogniAI',
    diary: 'Meu diário',
  },
  professionals: {
    title: 'Profissionais',
    description:
      'Confira o nome e o registro no conselho antes de aprovar. Só profissionais verificados podem convidar pacientes.',
    tabs: {
      label: 'Situação do cadastro',
      pending: 'Aguardando',
      verified: 'Verificados',
      rejected: 'Recusados',
    },
    empty: {
      pending: 'Nenhum cadastro aguardando verificação.',
      verified: 'Nenhum profissional verificado ainda.',
      rejected: 'Nenhum cadastro recusado.',
    },
    kind: 'Profissão',
    registration: 'Registro',
    noRegistration: 'Sem registro',
    email: 'Email',
    noEmail: 'Sem email',
    createdAt: 'Cadastro em {date}',
    reviewedAt: 'Revisado em {date}',
    approve: 'Aprovar',
    reject: 'Recusar',
    approved: 'Cadastro de {name} aprovado.',
    rejected: 'Cadastro de {name} recusado.',
    error: 'Não conseguimos salvar a revisão agora. Tente de novo em instantes.',
  },
}

export type AdminMessages = typeof admin
