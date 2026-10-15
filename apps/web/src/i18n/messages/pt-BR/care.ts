export const care = {
  invite: {
    meta: { title: 'Convite' },
    kicker: 'Convite',
    pending: {
      title: '{name} quer acompanhar seus registros.',
      lead: 'Com o vínculo, {name} vê como você tem se sentido entre as consultas. Você decide se os registros anteriores entram e pode encerrar quando quiser.',
      expiresInDays:
        'O convite vale por mais {count, plural, =0 {# dias} one {# dia} other {# dias}}.',
      expiresInHours:
        'O convite vale por mais {count, plural, =0 {# horas} one {# hora} other {# horas}}.',
      signUp: 'Criar conta para responder',
      signIn: 'Já tenho conta',
      signedOutHint: 'Primeiro você cria sua conta ou entra. Depois decide se aceita.',
      open: 'Ver o convite',
      opening: 'Abrindo…',
    },
    closed: {
      expired: {
        title: 'Este convite expirou.',
        body: 'Os convites valem por 72 horas. Se ainda quiser o vínculo, peça a {name} um novo link.',
      },
      accepted: {
        title: 'Este convite já foi aceito.',
        body: 'Os profissionais que acompanham seus registros aparecem em Perfil e configurações, na parte Profissionais.',
      },
      declined: {
        title: 'Este convite foi recusado.',
        body: 'Se mudou de ideia, peça a {name} um novo convite.',
      },
      canceled: {
        title: '{name} cancelou este convite.',
        body: 'Se ainda quiserem criar o vínculo, peça um novo convite.',
      },
    },
    unknown: {
      title: 'Não encontramos este convite.',
      body: 'Confira se o link está completo ou peça um novo a quem enviou.',
    },
    goToApp: 'Ir para o MyCogniAI',
    goHome: 'Conhecer o MyCogniAI',
  },
  sharing: {
    sharedTitle: 'O que {name} vai ver',
    shared: {
      checkIns: 'Seus registros de humor, com emoções, contextos e notas',
      screenings: 'Seus resultados do PHQ-9 e do GAD-7',
    },
    privateTitle: 'O que continua só com você',
    private: {
      account: 'Seu email, sua senha e as configurações da conta',
      others: 'Seus vínculos com outros profissionais',
    },
  },
  accept: {
    meta: { title: 'Convite' },
    kicker: 'Convite',
    title: '{name} quer acompanhar seus registros.',
    registration: '{registration}',
    history: {
      label: 'Compartilhar também meus registros anteriores',
      off: '{name} verá só o que você registrar a partir de hoje.',
      on: '{name} também verá tudo o que você registrou antes de hoje.',
    },
    terms: {
      title: 'Termos de compartilhamento',
      version: 'Versão {version}',
      purpose:
        'Ao aceitar, você autoriza {name} a ver seus registros de humor, com emoções, contextos e notas, e seus resultados do PHQ-9 e do GAD-7, para acompanhar sua evolução.',
      history:
        'Por padrão, entram só os registros feitos a partir de hoje. Os anteriores entram apenas se você ligar a opção acima.',
      end: 'Você pode encerrar o vínculo quando quiser, em Perfil e configurações. A partir daí, {name} deixa de ver seus registros.',
      privacy:
        'O vínculo não dá acesso a mais nada da sua conta. Saiba mais na <link>política de privacidade</link>.',
      agreement: 'Aceitar significa concordar com estes termos.',
    },
    submit: 'Aceitar',
    accepting: 'Aceitando…',
    decline: 'Recusar',
    declining: 'Recusando…',
    later: 'Decidir depois',
    closed: {
      accepted: 'Você aceitou este convite em {date}.',
      declined: 'Você recusou este convite em {date}.',
      canceled: '{name} cancelou este convite em {date}.',
      expired:
        'Este convite expirou em {date}. Se ainda quiser o vínculo, peça a {name} um novo link.',
    },
    seeProfessionals: 'Ver seus profissionais',
    back: 'Voltar aos convites',
  },
  invites: {
    meta: { title: 'Convites' },
    title: 'Convites',
    description: 'Convites de profissionais para acompanhar seus registros.',
    empty:
      'Você ainda não recebeu convites. Quando um profissional convidar você, o convite aparece aqui e nas notificações.',
    groups: {
      pending: 'Aguardando sua resposta',
      accepted: 'Aceitos',
      declined: 'Recusados',
      canceled: 'Cancelados',
      expired: 'Expirados',
    },
    dates: {
      pending: 'Recebido em {date}',
      accepted: 'Aceito em {date}',
      declined: 'Recusado em {date}',
      canceled: 'Cancelado em {date}',
      expired: 'Expirou em {date}',
    },
    respond: 'Responder',
  },
  notifications: {
    meta: { title: 'Notificações' },
    title: 'Notificações',
    empty: 'Nada por aqui por enquanto.',
    new: 'Nova',
    invitation: '{name} convidou você para acompanhar seus registros.',
    invitationStatus: {
      pending: 'Aguardando sua resposta',
      accepted: 'Você aceitou',
      declined: 'Você recusou',
      canceled: 'Convite cancelado',
      expired: 'Convite expirado',
    },
    open: {
      invitation: 'Ver convite',
      professional: 'Ver profissionais',
      insight: 'Ver resumo',
    },
    kinds: {
      invitation: 'Convite de um profissional',
      professional: 'Mensagem de um profissional',
      marketing: 'Novidade do MyCogniAI',
      system: 'Aviso do MyCogniAI',
      insight: 'Seu resumo da semana está pronto.',
    },
  },
  bell: {
    label:
      '{count, plural, =0 {Notificações} one {Notificações, # não lida} other {Notificações, # não lidas}}',
    unread: '{count, plural, =0 {# não lidas} one {# não lida} other {# não lidas}}',
    seeAll: 'Ver todas',
  },
  links: {
    title: 'Profissionais',
    empty: 'Nenhum profissional acompanha seus registros.',
    since: 'Desde {date}',
    alerts:
      'Quem acompanha você recebe um alerta em situações específicas, como respostas que indicam risco, uma piora importante do humor ou muitos dias sem registros.',
    history: {
      shared: 'Inclui registros anteriores',
      fromStart: 'Só registros a partir do vínculo',
    },
    end: {
      open: 'Encerrar vínculo',
      warning:
        '{name} deixa de ver seus registros a partir de agora. Para voltar, será preciso um novo convite.',
      confirm: 'Encerrar vínculo',
      ending: 'Encerrando…',
      cancel: 'Cancelar',
    },
    invites: 'Ver convites',
    professionalArea: 'Área profissional',
  },
  feedback: {
    unavailable: 'Este convite não está mais disponível. Peça um novo a quem enviou.',
    notPending: 'Este convite já foi respondido ou não vale mais.',
    alreadyLinked: 'Você já compartilha seus registros com {name}.',
    error: 'Não conseguimos concluir agora. Tente de novo em instantes.',
    endError: 'Não conseguimos encerrar o vínculo agora. Tente de novo em instantes.',
  },
}

export type CareMessages = typeof care
