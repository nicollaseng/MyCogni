import type { ProfessionalMessages } from '../pt-BR/professional'

export const professional: ProfessionalMessages = {
  meta: {
    join: 'Para profissionais de saúde',
    patients: 'Pacientes',
    invites: 'Convites',
    patient: 'Ficha do paciente',
  },
  shell: {
    area: 'Área profissional',
    navigation: 'Navegação da área profissional',
    patients: 'Pacientes',
    invites: 'Convites',
    diary: 'O meu diário',
  },
  join: {
    kicker: 'Para profissionais de saúde',
    title: 'Acompanhe os seus pacientes entre as consultas.',
    lead: 'Quando um paciente aceita o seu convite, passa a ver num só lugar os registos de humor e os resultados do PHQ-9 e do GAD-7 que essa pessoa escolheu partilhar.',
    offersTitle: 'O que encontra',
    offers: {
      checkIns: {
        title: 'Registos do dia a dia',
        body: 'Humor, emoções, contextos e notas, com o humor dos últimos 30 dias num gráfico.',
      },
      screenings: {
        title: 'PHQ-9 e GAD-7',
        body: 'O histórico dos questionários com a intensidade de cada resultado. Mostram sinais, não fazem diagnóstico.',
      },
      consent: {
        title: 'Sempre com consentimento',
        body: 'O paciente aceita cada convite, escolhe se partilha registos anteriores e pode terminar a ligação quando quiser.',
      },
    },
    verification:
      'Todos os registos profissionais passam por uma verificação manual da equipa MyCogniAI antes de os convites ficarem disponíveis.',
    signUp: 'Criar conta',
    signIn: 'Já tenho conta',
  },
  form: {
    title: 'O seu registo profissional',
    lead: 'Depois de enviar, a nossa equipa confirma a sua inscrição antes de disponibilizar os convites.',
    kind: 'Profissão',
    fullName: 'Nome completo',
    fullNameHint: 'É este o nome que os seus pacientes vão ver.',
    registration: 'Número de inscrição na ordem',
    registrationOptional: 'Inscrição profissional (opcional)',
    registrationHints: {
      psychologist: 'Ex.: OPP 012345',
      psychiatrist: 'Ex.: OM 12345',
      physician: 'Ex.: OM 12345',
      psychoanalyst: 'Se tiver, indique a inscrição da sua formação ou associação.',
    },
    consent:
      'Tenho 18 anos ou mais e aceito os <terms>termos de utilização</terms> e a <privacy>política de privacidade</privacy>.',
    submit: 'Enviar para verificação',
    sending: 'A enviar…',
    errors: {
      kindRequired: 'Escolha a sua profissão.',
      fullNameRequired: 'Escreva o seu nome completo.',
      fullNameTooLong: 'Use no máximo 120 caracteres.',
      registrationRequired: 'Indique o seu número de inscrição na ordem.',
      registrationTooShort: 'Confirme a inscrição: use pelo menos 3 caracteres.',
      registrationTooLong: 'Use no máximo 40 caracteres.',
      consentRequired:
        'Para continuar, aceite os termos de utilização e a política de privacidade.',
      save: 'Não foi possível enviar o seu registo agora. Tente novamente dentro de instantes.',
    },
  },
  status: {
    pending: {
      title: 'O seu registo está em verificação.',
      body: 'A nossa equipa confirma manualmente a sua inscrição profissional antes de disponibilizar os convites.',
      next: 'O que acontece agora',
      steps: {
        review: 'Confirmamos o seu nome e a sua inscrição na ordem.',
        approve: 'Com o registo aprovado, esta página passa a mostrar os seus pacientes.',
        invite: 'Convida pacientes por email ou por ligação, e cada pessoa decide se aceita.',
      },
      submitted: 'Registo enviado a {date}.',
    },
    rejected: {
      title: 'Não foi possível verificar o seu registo.',
      body: 'Se considera que houve um engano ou quer enviar outros dados, escreva para <link>{email}</link> com o seu nome e a sua inscrição.',
    },
  },
  patients: {
    title: 'Pacientes',
    description: 'Pessoas que aceitaram partilhar os registos consigo.',
    invite: 'Convidar paciente',
    emptyTitle: 'Ainda não há pacientes.',
    emptyBody: 'Quando alguém aceitar o seu convite, os registos dessa pessoa aparecem aqui.',
    unnamed: 'Paciente sem nome',
    since: 'Desde {date}',
    lastCheckIn: 'Último registo',
    noCheckIn: 'Ainda sem registos',
    lastWeek: 'Últimos 7 dias',
    weekCount: '{count, plural, =0 {Nenhum registo} one {# registo} other {# registos}}',
    notAnswered: 'Sem resposta',
    ago: '{days, plural, =0 {hoje} =1 {ontem} other {há # dias}}',
  },
  risk: {
    label: 'Atenção ao item 9 do PHQ-9',
    short: 'Item 9 positivo',
    detail:
      'No PHQ-9 de {date}, houve resposta positiva ao item 9, sobre pensamentos de morte ou de autolesão.',
  },
  patient: {
    back: 'Pacientes',
    kicker: 'Ficha do paciente',
    since: 'Partilha registos consigo desde {date}.',
    fromLink: 'Vê os registos feitos a partir da ligação.',
    withHistory: 'Inclui registos anteriores à ligação, por escolha da pessoa.',
    mood: {
      title: 'Humor nos últimos {days} dias',
      label:
        '{count, plural, one {# dia com registo} other {# dias com registo}} nos últimos {days} dias',
      emptyLabel: 'Nenhum registo nos últimos {days} dias',
      empty: 'Nenhum registo de humor nos últimos {days} dias.',
    },
    trend: {
      recent: 'Humor médio dos últimos 7 dias: {mood} ({average} em {max}).',
      up: 'Acima dos 7 dias anteriores ({previous}).',
      down: 'Abaixo dos 7 dias anteriores ({previous}).',
      steady: 'Semelhante aos 7 dias anteriores ({previous}).',
    },
    screenings: {
      title: 'Questionários',
      empty: 'Nenhum questionário respondido no período partilhado.',
      score: '{score} em {max}',
      note: 'Os questionários mostram a intensidade de sinais. Não fazem diagnóstico.',
    },
    entries: {
      title: 'Registos dos últimos {days} dias',
      empty: 'Nenhum registo nos últimos {days} dias.',
    },
  },
  invites: {
    title: 'Convites',
    description:
      'Convide pacientes por email ou por ligação. Cada convite é válido durante {hours} horas e só cria a ligação se a pessoa aceitar.',
    form: {
      title: 'Novo convite',
      channel: 'Como enviar',
      email: 'Por email',
      link: 'Por ligação',
      recipient: 'Email do paciente',
      recipientHint: 'O email segue no idioma em que está a usar a aplicação.',
      linkHint: 'Recebe uma ligação para enviar por WhatsApp, SMS ou como preferir.',
      sendEmail: 'Enviar convite',
      createLink: 'Criar ligação',
      sending: 'A criar…',
      invalidEmail: 'Escreva um email válido.',
      error: 'Não foi possível criar o convite agora. Tente novamente dentro de instantes.',
    },
    result: {
      emailSent: 'Convite enviado para {email}.',
      emailNotSent:
        'Não foi possível enviar o email agora. Copie a ligação e envie-a para {email} como preferir.',
      link: 'Ligação criada. Copie-a e envie-a à pessoa como preferir.',
      validity: 'Válida até {date}.',
    },
    link: 'Ligação do convite',
    copy: 'Copiar ligação',
    copied: 'Ligação copiada',
    copyFailed: 'Não foi possível copiar. Selecione a ligação e copie-a.',
    sent: {
      title: 'Convites enviados',
      empty: 'Ainda não enviou convites.',
      byLink: 'Convite por ligação',
      created: 'Criado a {date}',
      expires: 'Válido até {date}',
      expired: 'Expirou a {date}',
      responded: 'Respondido a {date}',
      resend: 'Reenviar',
      renew: 'Gerar nova ligação',
      cancel: 'Cancelar convite',
      resent: 'Convite reenviado para {email}.',
      resentNotSent:
        'Criámos um novo convite, mas o email não foi enviado. Copie a nova ligação e envie-a para {email}.',
      renewed: 'Nova ligação criada. Copie-a e envie-a à pessoa.',
      canceled: 'Convite cancelado.',
      error: 'Não foi possível concluir agora. Tente novamente dentro de instantes.',
    },
    statuses: {
      pending: 'A aguardar resposta',
      accepted: 'Aceite',
      declined: 'Recusado',
      canceled: 'Cancelado',
      expired: 'Expirado',
    },
  },
}
