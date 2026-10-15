export const zen = {
  meta: {
    title: 'Zen Space',
  },
  title: 'Zen Space',
  disclaimer: 'Conteúdo educativo. Não substitui acompanhamento profissional.',
  back: 'Zen Space',
  minutes: '{minutes} min',
  kinds: {
    read: 'Leitura',
    breathe: 'Respiração',
    write: 'Escrita',
    check_in: 'Registro',
    reflect: 'Reflexão',
    questionnaire: 'Questionários',
    support: 'Apoio',
  },
  today: {
    title: 'Para hoje',
    kicker: '{track} · passo {step} de {total}',
    start: 'Começar',
    continue: 'Continuar',
    allDone: 'Você concluiu todas as trilhas. Um minuto de respiração ajuda a fechar o dia.',
  },
  quickBreathe: 'Respirar 1 min',
  why: {
    title: 'Por que esta sugestão?',
    rules:
      'Regras simples sobre seus questionários mais recentes e seus registros dos últimos 7 dias. Não é um diagnóstico.',
    retake: 'Refazer os questionários',
    reasons: {
      risk_item:
        'No seu PHQ-9 mais recente, você contou ter pensado em se ferir ou que seria melhor estar morto/a.',
      severe_result:
        'Um dos seus questionários mais recentes ficou na faixa grave ou moderadamente grave.',
      anxiety: 'Seu GAD-7 mais recente ficou na faixa moderada ou acima.',
      depression: 'Seu PHQ-9 mais recente ficou na faixa moderada ou acima.',
      low_mood: 'O humor médio dos seus registros dos últimos 7 dias ficou baixo.',
      starting: 'Nada nos seus resultados pede atenção agora. O sono é um bom começo.',
    },
  },
  topics: {
    title: 'Do que você precisa?',
    names: {
      anxiety: 'Ansiedade',
      mood: 'Humor',
      sleep: 'Sono',
      performance: 'Pressão e desempenho',
      help: 'Buscar ajuda',
    },
    track: 'Trilha',
    readings: 'Leituras',
  },
  library: {
    tracks: 'Trilhas',
    readings: 'Leituras',
    more: 'Mais {count, plural, =0 {# leituras} one {# leitura} other {# leituras}}',
  },
  status: {
    new: 'Não iniciada',
    started: '{done} de {total}',
    complete: 'Concluída',
  },
  help: {
    open: 'Ajuda agora',
    title: 'Ajuda agora',
    call: 'Em perigo agora? Ligue:',
    attention: 'Seus resultados pedem atenção. Fale com alguém hoje.',
    professional: '{name} acompanha seus registros.',
    breathe: 'Respirar 1 min',
    more: 'Quando buscar ajuda',
    close: 'Fechar',
  },
  article: {
    kicker: 'Leitura · {minutes} min',
    sources: 'Fontes',
    partOf: 'Faz parte de',
  },
  track: {
    kicker:
      'Trilha · {count, plural, =0 {# passos} one {# passo} other {# passos}} · {minutes} min',
    progress: '{done} de {total} passos feitos',
    steps: 'Passos',
    next: 'Próximo: {title} · {minutes} min',
    done: 'Feito',
    markDone: 'Marcar como feito',
    saving: 'Salvando…',
    saveError: 'Não foi possível salvar agora. Tente de novo em instantes.',
    writeError: 'Não foi possível abrir uma página no MyBook agora. Tente de novo em instantes.',
    opening: 'Abrindo o MyBook…',
    complete: 'Trilha concluída. Volte quando quiser.',
    actions: {
      read: 'Ler',
      breathe: 'Começar o exercício',
      write: 'Escrever no MyBook',
      check_in: 'Fazer um registro',
      questionnaire: 'Responder os questionários',
    },
    reflectHint: 'Pense com calma. Se quiser, escreva no MyBook.',
  },
  breathing: {
    title: 'Respirar em quadrado',
    intro:
      'Inspire, segure, solte e espere, contando até quatro. Se sentir tontura, respire normalmente.',
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
