import type { CareMessages } from '../pt-BR/care'

export const care: CareMessages = {
  invite: {
    meta: { title: 'Convite' },
    kicker: 'Convite',
    pending: {
      title: '{name} quer acompanhar os seus registos.',
      lead: 'Com a ligação, {name} vê como se tem sentido entre as consultas. Decide se os registos anteriores são incluídos e pode terminar a ligação quando quiser.',
      expiresInDays: 'O convite é válido por mais {count, plural, one {# dia} other {# dias}}.',
      expiresInHours: 'O convite é válido por mais {count, plural, one {# hora} other {# horas}}.',
      signUp: 'Criar conta para responder',
      signIn: 'Já tenho conta',
      signedOutHint: 'Primeiro cria a sua conta ou inicia sessão. Depois decide se aceita.',
      open: 'Ver o convite',
      opening: 'A abrir…',
    },
    closed: {
      expired: {
        title: 'Este convite expirou.',
        body: 'Os convites são válidos durante 72 horas. Se ainda quiser a ligação, peça um novo convite a {name}.',
      },
      accepted: {
        title: 'Este convite já foi aceite.',
        body: 'Os profissionais que acompanham os seus registos aparecem em Perfil e definições, na secção Profissionais.',
      },
      declined: {
        title: 'Este convite foi recusado.',
        body: 'Se mudou de ideias, peça um novo convite a {name}.',
      },
      canceled: {
        title: '{name} cancelou este convite.',
        body: 'Se ainda quiserem criar a ligação, peça um novo convite.',
      },
    },
    unknown: {
      title: 'Não encontrámos este convite.',
      body: 'Confirme se o link está completo ou peça um novo a quem o enviou.',
    },
    goToApp: 'Ir para o MyCogniAI',
    goHome: 'Conhecer o MyCogniAI',
  },
  sharing: {
    sharedTitle: 'O que {name} vai ver',
    shared: {
      checkIns: 'Os seus registos de humor, com emoções, contextos e notas',
      screenings: 'As suas respostas sobre ânimo e ansiedade',
    },
    privateTitle: 'O que continua só consigo',
    private: {
      account: 'O seu email, a sua palavra-passe e as definições da conta',
      others: 'As suas ligações a outros profissionais',
    },
  },
  accept: {
    meta: { title: 'Convite' },
    kicker: 'Convite',
    title: '{name} quer acompanhar os seus registos.',
    registration: '{registration}',
    history: {
      label: 'Partilhar também os meus registos anteriores',
      off: '{name} verá apenas o que registar a partir de hoje.',
      on: '{name} também verá tudo o que registou antes de hoje.',
    },
    terms: {
      title: 'Termos de partilha',
      version: 'Versão {version}',
      purpose:
        'Ao aceitar, autoriza {name} a ver os seus registos de humor, com emoções, contextos e notas, e os seus resultados do PHQ-9 e do GAD-7, para acompanhar a sua evolução.',
      history:
        'Por predefinição, só são incluídos os registos feitos a partir de hoje. Os anteriores só são incluídos se ativar a opção acima.',
      end: 'Pode terminar a ligação quando quiser, em Perfil e definições. A partir desse momento, {name} deixa de ver os seus registos.',
      privacy:
        'A ligação não dá acesso a mais nada da sua conta. Saiba mais na <link>política de privacidade</link>.',
      agreement: 'Aceitar significa concordar com estes termos.',
      confirmAgreement: 'Confirmar significa concordar com estes termos.',
    },
    submit: 'Aceitar',
    accepting: 'A aceitar…',
    decline: 'Recusar',
    declining: 'A recusar…',
    later: 'Decidir mais tarde',
    closed: {
      accepted: 'Aceitou este convite em {date}.',
      declined: 'Recusou este convite em {date}.',
      canceled: '{name} cancelou este convite em {date}.',
      expired:
        'Este convite expirou em {date}. Se ainda quiser a ligação, peça um novo convite a {name}.',
    },
    seeProfessionals: 'Ver os seus profissionais',
    back: 'Voltar aos convites',
  },
  invites: {
    meta: { title: 'Convites' },
    title: 'Convites',
    description: 'Convites de profissionais para acompanhar os seus registos.',
    empty: {
      title: 'Ainda não recebeu convites.',
      description:
        'Quando um profissional enviar um convite, este aparece aqui e nas notificações.',
    },
    groups: {
      pending: 'A aguardar a sua resposta',
      accepted: 'Aceites',
      declined: 'Recusados',
      canceled: 'Cancelados',
      expired: 'Expirados',
    },
    dates: {
      pending: 'Recebido em {date}',
      accepted: 'Aceite em {date}',
      declined: 'Recusado em {date}',
      canceled: 'Cancelado em {date}',
      expired: 'Expirou em {date}',
    },
    respond: 'Responder',
  },
  notifications: {
    meta: { title: 'Notificações' },
    title: 'Notificações',
    empty: 'Ainda não há nada por aqui.',
    new: 'Nova',
    invitation: '{name} enviou-lhe um convite para acompanhar os seus registos.',
    invitationStatus: {
      pending: 'A aguardar a sua resposta',
      accepted: 'Aceitou',
      declined: 'Recusou',
      canceled: 'Convite cancelado',
      expired: 'Convite expirado',
    },
    open: {
      invitation: 'Ver convite',
      professional: 'Ver profissionais',
      insight: 'Ver resumo',
      support: 'Ver pedido',
    },
    kinds: {
      invitation: 'Convite de um profissional',
      professional: 'Mensagem de um profissional',
      marketing: 'Novidades do MyCogniAI',
      system: 'Aviso do MyCogniAI',
      insight: 'O seu resumo da semana está pronto.',
      support: 'Atualização do apoio',
    },
    support:
      '{status, select, in_progress {O seu pedido {ticket} está em curso.} closed {O seu pedido {ticket} foi fechado.} other {O seu pedido {ticket} foi atualizado.}}',
  },
  bell: {
    label:
      '{count, plural, =0 {Notificações} one {Notificações, # não lida} other {Notificações, # não lidas}}',
    unread: '{count, plural, one {# não lida} other {# não lidas}}',
    seeAll: 'Ver todas',
  },
  links: {
    title: 'Profissionais',
    empty: 'Nenhum profissional acompanha os seus registos.',
    since: 'Desde {date}',
    alerts:
      'Os profissionais ligados à sua conta recebem um alerta em situações específicas, como respostas que indicam risco, uma descida importante do humor ou muitos dias sem registos.',
    history: {
      shared: 'Inclui registos anteriores',
      fromStart: 'Só registos a partir da ligação',
    },
    end: {
      open: 'Terminar ligação',
      warning:
        '{name} deixa de ver os seus registos a partir de agora. Para voltar, será preciso um novo convite.',
      confirm: 'Terminar ligação',
      ending: 'A terminar…',
      cancel: 'Cancelar',
    },
    invites: 'Ver convites',
  },
  terms: {
    meta: { title: 'Termos atualizados' },
    kicker: 'Termos atualizados',
    title: 'Reveja e confirme os novos termos.',
    lead: 'Enquanto não confirmar, {name} continua a ver os seus registos tal como aceitou antes. Se preferir, pode terminar a ligação.',
    changes: {
      title: 'O que mudou',
      body: 'Apenas o nome do local onde termina a ligação: agora é Perfil e definições. O resto mantém-se igual.',
    },
    confirm: 'Confirmar',
    confirming: 'A confirmar…',
    notice: 'Atualizámos os termos de partilha. <link>Reveja e confirme</link>.',
    status: 'Confirme os novos termos',
  },
  feedback: {
    unavailable: 'Este convite já não está disponível. Peça um novo a quem o enviou.',
    notPending: 'Este convite já foi respondido ou deixou de ser válido.',
    alreadyLinked: 'Já partilha os seus registos com {name}.',
    error: 'Não foi possível concluir agora. Tente novamente dentro de instantes.',
    endError: 'Não foi possível terminar a ligação agora. Tente novamente dentro de instantes.',
    linkEnded: 'Esta ligação já foi terminada.',
    termsError: 'Não foi possível confirmar os termos agora. Tente novamente dentro de instantes.',
  },
}
