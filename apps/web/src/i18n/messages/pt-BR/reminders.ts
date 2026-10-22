export const reminders = {
  meta: { title: 'Lembretes' },
  lead: 'Um aviso gentil no horário que você escolher, para uma pausa.',
  enabled: {
    label: 'Lembrete para praticar',
    hint: 'No máximo um por dia.',
  },
  time: 'Horário',
  days: {
    legend: 'Dias',
    short: { sun: 'Dom', mon: 'Seg', tue: 'Ter', wed: 'Qua', thu: 'Qui', fri: 'Sex', sat: 'Sáb' },
    long: {
      sun: 'Domingo',
      mon: 'Segunda-feira',
      tue: 'Terça-feira',
      wed: 'Quarta-feira',
      thu: 'Quinta-feira',
      fri: 'Sexta-feira',
      sat: 'Sábado',
    },
  },
  channels: {
    legend: 'Como avisar',
    push: 'Notificação neste aparelho',
    email: 'Email',
  },
  push: {
    install:
      'No iPhone, as notificações chegam com o app na Tela de Início: toque em Compartilhar e depois em Adicionar à Tela de Início.',
    blocked: 'As notificações estão bloqueadas neste navegador. Libere nas configurações do site.',
    unsupported: 'Este navegador não recebe notificações. O email continua funcionando.',
    unavailable: 'As notificações ainda não estão disponíveis. O email continua funcionando.',
  },
  save: 'Salvar',
  saved: 'Lembrete salvo.',
  error: 'Não conseguimos salvar agora. Tente de novo em instantes.',
  offer: {
    title: 'Quer um lembrete diário para praticar?',
    time: 'Horário do lembrete',
    accept: 'Lembrar todo dia',
    later: 'Agora não',
    done: 'Combinado. Lembramos você às {time}.',
    settings: 'Ajustar lembretes',
  },
  emailOff: {
    meta: { title: 'Lembretes por email' },
    title: 'Lembretes por email desligados',
    body: 'Você não vai mais receber lembretes por email. Pode ligar de novo quando quiser.',
    invalidTitle: 'Este link não funcionou',
    invalidBody: 'Você pode desligar os lembretes em Perfil e configurações → Lembretes.',
    settings: 'Abrir lembretes',
  },
}

export type RemindersMessages = typeof reminders
