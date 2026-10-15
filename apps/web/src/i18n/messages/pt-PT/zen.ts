import type { ZenMessages } from '../pt-BR/zen'

export const zen: ZenMessages = {
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
    check_in: 'Registo',
    reflect: 'Reflexão',
    questionnaire: 'Questionários',
    support: 'Apoio',
  },
  today: {
    title: 'Para hoje',
    kicker: '{track} · passo {step} de {total}',
    start: 'Começar',
    continue: 'Continuar',
    allDone: 'Concluiu todos os percursos. Um minuto de respiração ajuda a fechar o dia.',
  },
  quickBreathe: 'Respirar 1 min',
  why: {
    title: 'Porquê esta sugestão?',
    rules:
      'Regras simples sobre os seus questionários mais recentes e os seus registos dos últimos 7 dias. Não é um diagnóstico.',
    retake: 'Responder de novo aos questionários',
    reasons: {
      risk_item:
        'No seu PHQ-9 mais recente, referiu ter pensado que seria melhor estar morto/a ou em magoar-se.',
      severe_result:
        'Um dos seus questionários mais recentes ficou no nível grave ou moderadamente grave.',
      anxiety: 'O seu GAD-7 mais recente ficou no nível moderado ou acima.',
      depression: 'O seu PHQ-9 mais recente ficou no nível moderado ou acima.',
      low_mood: 'O humor médio dos seus registos dos últimos 7 dias ficou baixo.',
      starting: 'Nada nos seus resultados pede atenção agora. O sono é um bom começo.',
    },
  },
  topics: {
    title: 'De que precisa?',
    names: {
      anxiety: 'Ansiedade',
      mood: 'Humor',
      sleep: 'Sono',
      performance: 'Pressão e desempenho',
      help: 'Procurar ajuda',
    },
    track: 'Percurso',
    readings: 'Leituras',
  },
  library: {
    tracks: 'Percursos',
    readings: 'Leituras',
    more: 'Mais {count, plural, =0 {# leituras} one {# leitura} other {# leituras}}',
  },
  status: {
    new: 'Por começar',
    started: '{done} de {total}',
    complete: 'Concluído',
  },
  help: {
    open: 'Ajuda agora',
    title: 'Ajuda agora',
    call: 'Em perigo agora? Ligue:',
    breathe: 'Respirar 1 min',
    more: 'Quando procurar ajuda',
    close: 'Fechar',
  },
  article: {
    kicker: 'Leitura · {minutes} min',
    sources: 'Fontes',
    partOf: 'Faz parte de',
  },
  track: {
    kicker:
      'Percurso · {count, plural, =0 {# passos} one {# passo} other {# passos}} · {minutes} min',
    progress: '{done} de {total} passos feitos',
    steps: 'Passos',
    next: 'Próximo: {title} · {minutes} min',
    done: 'Feito',
    markDone: 'Marcar como feito',
    saving: 'A guardar…',
    saveError: 'Não foi possível guardar agora. Tente de novo dentro de instantes.',
    writeError:
      'Não foi possível abrir uma página no MyBook agora. Tente de novo dentro de instantes.',
    opening: 'A abrir o MyBook…',
    complete: 'Percurso concluído. Volte quando quiser.',
    actions: {
      read: 'Ler',
      breathe: 'Começar o exercício',
      write: 'Escrever no MyBook',
      check_in: 'Fazer um registo',
      questionnaire: 'Responder aos questionários',
    },
    reflectHint: 'Pense com calma. Se quiser, escreva no MyBook.',
  },
  breathing: {
    title: 'Respirar em quadrado',
    intro:
      'Inspire, sustenha, expire e espere, a contar até quatro. Se sentir tonturas, respire normalmente.',
    start: 'Começar',
    pause: 'Pausar',
    resume: 'Continuar',
    restart: 'Recomeçar',
    close: 'Fechar',
    phases: {
      inhale: 'Inspire',
      holdIn: 'Sustenha',
      exhale: 'Expire',
      holdOut: 'Espere',
    },
    ready: 'Pronto para começar',
    round: 'Volta {current} de {total}',
    finished: 'Pronto. Como se sente agora?',
  },
}
