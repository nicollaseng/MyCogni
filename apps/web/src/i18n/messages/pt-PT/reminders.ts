import type { RemindersMessages } from '../pt-BR/reminders'

export const reminders: RemindersMessages = {
  meta: { title: 'Lembretes' },
  lead: 'Um aviso suave à hora que escolher, para uma pausa.',
  enabled: {
    label: 'Lembrete para praticar',
    hint: 'No máximo um por dia.',
  },
  time: 'Hora',
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
    push: 'Notificação neste dispositivo',
    email: 'Email',
  },
  push: {
    install:
      'No iPhone, as notificações chegam com a aplicação no ecrã principal: toque em Partilhar e depois em Adicionar ao ecrã principal.',
    blocked:
      'As notificações estão bloqueadas neste navegador. Autorize-as nas definições do site.',
    unsupported: 'Este navegador não recebe notificações. O email continua a funcionar.',
    unavailable: 'As notificações ainda não estão disponíveis. O email continua a funcionar.',
  },
  save: 'Guardar',
  saved: 'Lembrete guardado.',
  error: 'Não foi possível guardar agora. Tente novamente dentro de momentos.',
  offer: {
    title: 'Quer um lembrete diário para praticar?',
    time: 'Hora do lembrete',
    accept: 'Lembrar todos os dias',
    later: 'Agora não',
    done: 'Combinado. Lembramos às {time}.',
    settings: 'Ajustar lembretes',
  },
  emailOff: {
    meta: { title: 'Lembretes por email' },
    title: 'Lembretes por email desligados',
    body: 'Deixa de receber lembretes por email. Pode voltar a ligá-los quando quiser.',
    invalidTitle: 'Este link não funcionou',
    invalidBody: 'Pode desligar os lembretes em Perfil e definições → Lembretes.',
    settings: 'Abrir lembretes',
  },
}
