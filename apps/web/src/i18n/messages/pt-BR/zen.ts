export const zen = {
  meta: {
    title: 'Zen Space',
  },
  title: 'Zen Space',
  description:
    'Leituras curtas, trilhas e exercícios para cuidar da cabeça no seu ritmo, com base no que a ciência sabe hoje.',
  disclaimer: 'Conteúdo educativo, não substitui acompanhamento profissional.',
  forYou: {
    title: 'Para você agora',
    kicker: 'Trilha sugerida',
    progress: '{done} de {total} passos',
    start: 'Começar a trilha',
    continue: 'Continuar a trilha',
    review: 'Rever a trilha',
    also: 'Também pode ajudar',
    readings: 'Leituras sugeridas',
    why: 'Por que estas sugestões?',
    rules:
      'As sugestões seguem regras simples sobre os seus questionários mais recentes e os seus registros dos últimos 7 dias. Não são um diagnóstico.',
    reasons: {
      risk_item:
        'No seu PHQ-9 mais recente, você contou ter pensado em se ferir ou que seria melhor estar morto/a.',
      severe_result:
        'Um dos seus questionários mais recentes ficou na faixa grave ou moderadamente grave.',
      anxiety: 'O seu GAD-7 mais recente ficou na faixa moderada ou acima.',
      depression: 'O seu PHQ-9 mais recente ficou na faixa moderada ou acima.',
      low_mood: 'O humor médio dos seus registros dos últimos 7 dias ficou baixo.',
      starting:
        'Nada nos seus resultados recentes pede atenção agora. O sono é um bom ponto de partida para cuidar do humor.',
    },
  },
  help: {
    title: 'Cuide disso com alguém',
    body: 'Os seus resultados recentes pedem atenção. Converse com um profissional de saúde sobre como você tem se sentido. Se estiver em perigo agora, ligue:',
    professional: '{name} acompanha os seus registros. Vale contar a {name} o que mudou.',
  },
  tracks: {
    title: 'Trilhas',
    status: {
      new: 'Não iniciada',
      started: '{done} de {total} passos',
      complete: 'Concluída',
    },
  },
  readings: {
    title: 'Leituras',
    minutes: '{minutes} min de leitura',
  },
  article: {
    back: 'Zen Space',
    kicker: 'Leitura · {minutes} min',
    references: 'Referências',
    inTracks: 'Esta leitura faz parte de',
    helpTitle: 'Contatos de ajuda',
  },
  track: {
    back: 'Zen Space',
    kicker: 'Trilha · {count, plural, =0 {# passos} one {# passo} other {# passos}}',
    progress: '{done} de {total} passos feitos',
    step: 'Passo {number}',
    done: 'Feito',
    markDone: 'Marcar como feito',
    saving: 'Salvando…',
    saveError: 'Não foi possível salvar agora. Tente de novo em instantes.',
    writeError: 'Não foi possível abrir uma página no MyBook agora. Tente de novo em instantes.',
    opening: 'Abrindo o MyBook…',
    complete: 'Você concluiu esta trilha. Volte a ela quando quiser.',
    actions: {
      read: 'Ler',
      breathe: 'Começar o exercício',
      write: 'Escrever no MyBook',
      check_in: 'Fazer um registro',
      questionnaire: 'Responder os questionários',
    },
    reflectHint: 'Pense nisso com calma. Se quiser, escreva a resposta no MyBook.',
  },
  breathing: {
    title: 'Respirar em quadrado',
    intro:
      'Inspire, segure, solte e espere, contando até quatro em cada parte. Quatro voltas levam cerca de um minuto. Se sentir tontura, volte a respirar normalmente.',
    start: 'Começar',
    pause: 'Pausar',
    resume: 'Continuar',
    restart: 'Recomeçar',
    close: 'Fechar',
    phases: {
      inhale: 'Inspire',
      holdIn: 'Segure',
      exhale: 'Solte',
      holdOut: 'Espere',
    },
    ready: 'Pronto para começar',
    round: 'Volta {current} de {total}',
    finished: 'Pronto. Como você está agora?',
  },
}

export type ZenMessages = typeof zen
