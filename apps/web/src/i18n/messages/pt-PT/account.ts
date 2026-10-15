import type { AccountMessages } from '../pt-BR/account'

export const account: AccountMessages = {
  title: 'Perfil e definições',
  sections: {
    account: 'Conta',
    preferences: 'Preferências',
    privacy: 'Privacidade',
    data: 'Os seus dados',
  },
  profile: {
    photo: 'A sua fotografia',
    fallbackName: 'Perfil',
  },
  avatar: {
    add: 'Adicionar fotografia',
    change: 'Alterar fotografia',
    remove: 'Remover fotografia',
    uploading: 'A enviar…',
  },
  settings: {
    change: 'Alterar {field}',
    cancel: 'Cancelar',
  },
  name: {
    label: 'Nome',
    empty: 'Sem nome',
    field: 'Novo nome',
    save: 'Guardar nome',
    saving: 'A guardar…',
  },
  email: {
    label: 'Email',
    field: 'Novo email',
    send: 'Enviar confirmação',
    sending: 'A enviar…',
  },
  password: {
    label: 'Palavra-passe',
    current: 'Palavra-passe atual',
    next: 'Nova palavra-passe',
    hint: 'Pelo menos 8 caracteres, com letras e números.',
    save: 'Guardar nova palavra-passe',
    saving: 'A guardar…',
  },
  consents: {
    kinds: {
      terms: 'Termos de utilização',
      privacy: 'Política de privacidade',
      health_data: 'Utilização dos seus dados de saúde',
      adult: 'Confirmação de que tem 18 anos ou mais',
      ai_processing: 'Resumos escritos por IA',
    },
    granted: 'Autorizado em {date}',
    notGranted: 'Não autorizado',
    note: 'Os consentimentos obrigatórios só podem ser retirados eliminando a conta, em Os seus dados.',
  },
  data: {
    export: 'Transferir os meus dados',
    fileName: 'mycogniai-os-meus-dados-{day}.json',
  },
  delete: {
    open: 'Eliminar a minha conta',
    warning:
      'Isto elimina a sua conta, os seus registos, questionários, consentimentos e ligações a profissionais. Não é possível anular. Se quiser, transfira os seus dados antes.',
    word: 'ELIMINAR',
    confirm: 'Escreva {word} para confirmar',
    submit: 'Eliminar para sempre',
    deleting: 'A eliminar…',
    cancel: 'Cancelar',
  },
  signOut: 'Terminar sessão',
  feedback: {
    saveError: 'Não foi possível guardar agora. Tente novamente dentro de instantes.',
    nameRequired: 'Escreva um nome.',
    nameTooLong: 'Use no máximo {max} caracteres.',
    nameSaved: 'Nome atualizado.',
    emailSent:
      'Enviámos uma ligação para o novo email. A alteração só tem efeito depois de a confirmar.',
    wrongPassword: 'A palavra-passe atual não está correta.',
    passwordChanged: 'Palavra-passe alterada.',
    photoInvalid: 'Use uma imagem JPG, PNG ou WebP com até 2 MB.',
    photoSaved: 'Fotografia atualizada.',
    photoRemoved: 'Fotografia removida.',
    typeWord: 'Escreva {word} para confirmar.',
    deleteError:
      'Não foi possível eliminar a sua conta agora. Tente novamente dentro de instantes.',
    aiOn: 'Resumos por IA ativados.',
    aiOff: 'Resumos por IA desativados.',
  },
}
