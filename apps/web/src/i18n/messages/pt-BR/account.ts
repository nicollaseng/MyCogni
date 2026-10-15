export const account = {
  title: 'Perfil e configurações',
  sections: {
    account: 'Conta',
    preferences: 'Preferências',
    privacy: 'Privacidade',
    data: 'Seus dados',
  },
  profile: {
    photo: 'Sua foto',
    fallbackName: 'Você',
  },
  avatar: {
    add: 'Adicionar foto',
    change: 'Trocar foto',
    remove: 'Remover foto',
    uploading: 'Enviando…',
  },
  settings: {
    change: 'Alterar {field}',
    cancel: 'Cancelar',
  },
  name: {
    label: 'Nome',
    empty: 'Sem nome',
    field: 'Novo nome',
    save: 'Salvar nome',
    saving: 'Salvando…',
  },
  email: {
    label: 'Email',
    field: 'Novo email',
    send: 'Enviar confirmação',
    sending: 'Enviando…',
  },
  password: {
    label: 'Senha',
    current: 'Senha atual',
    next: 'Nova senha',
    hint: 'Pelo menos 8 caracteres, com letras e números.',
    save: 'Salvar nova senha',
    saving: 'Salvando…',
  },
  consents: {
    kinds: {
      terms: 'Termos de uso',
      privacy: 'Política de privacidade',
      health_data: 'Uso dos seus dados de saúde',
      adult: 'Confirmação de 18 anos ou mais',
      ai_processing: 'Resumos escritos por IA',
    },
    granted: 'Autorizado em {date}',
    notGranted: 'Não autorizado',
    note: 'Os consentimentos obrigatórios só podem ser retirados com a exclusão da conta, em Seus dados.',
  },
  data: {
    export: 'Baixar meus dados',
    fileName: 'mycogniai-meus-dados-{day}.json',
  },
  delete: {
    open: 'Excluir minha conta',
    warning:
      'Isso apaga sua conta, seus registros, questionários, consentimentos e vínculos com profissionais. Não dá para desfazer. Se quiser, baixe seus dados antes.',
    word: 'EXCLUIR',
    confirm: 'Digite {word} para confirmar',
    submit: 'Excluir para sempre',
    deleting: 'Excluindo…',
    cancel: 'Cancelar',
  },
  signOut: 'Sair',
  feedback: {
    saveError: 'Não conseguimos salvar agora. Tente de novo em instantes.',
    nameRequired: 'Digite um nome.',
    nameTooLong: 'Use até {max} caracteres.',
    nameSaved: 'Nome atualizado.',
    emailSent: 'Enviamos um link para o novo email. A troca vale depois que você confirmar.',
    wrongPassword: 'A senha atual não confere.',
    passwordChanged: 'Senha alterada.',
    photoInvalid: 'Use uma imagem JPG, PNG ou WebP de até 2 MB.',
    photoSaved: 'Foto atualizada.',
    photoRemoved: 'Foto removida.',
    typeWord: 'Digite {word} para confirmar.',
    deleteError: 'Não conseguimos excluir sua conta agora. Tente de novo em instantes.',
    aiOn: 'Resumos por IA ligados.',
    aiOff: 'Resumos por IA desligados.',
  },
}

export type AccountMessages = typeof account
