export const admin = {
  shell: {
    team: 'Equipe MyCogniAI',
  },
  professionals: {
    title: 'Profissionais',
    description:
      'Abra o comprovante e confira o nome e o registro antes de aprovar. Só profissionais verificados podem convidar pacientes.',
    tabs: {
      label: 'Situação do cadastro',
      pending: 'Aguardando',
      verified: 'Verificados',
      rejected: 'Recusados',
    },
    columns: {
      name: 'Nome',
      kind: 'Profissão',
      registration: 'Registro',
      email: 'Email',
      document: 'Comprovante',
      createdAt: 'Cadastro',
      actions: 'Ações',
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
    document: {
      open: 'Abrir',
      openLabel: 'Abrir comprovante de {name} em nova aba',
      missing: 'Aguardando envio',
    },
    rejectForm: {
      label: 'Motivo da recusa para {name}',
      hint: 'O profissional lê esta mensagem. Diga o que precisa ser corrigido.',
      confirm: 'Confirmar recusa',
      cancel: 'Cancelar',
      required: 'Escreva o motivo, com pelo menos 3 caracteres.',
    },
    note: 'Motivo: {note}',
    approve: 'Aprovar',
    reject: 'Recusar',
    approved: 'Cadastro de {name} aprovado.',
    rejected: 'Cadastro de {name} recusado.',
    error: 'Não conseguimos salvar a revisão agora. Tente de novo em instantes.',
  },
}

export type AdminMessages = typeof admin
