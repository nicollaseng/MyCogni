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
      'Regras simples sobre as suas respostas mais recentes, os seus registos das últimas duas semanas e a hora do dia. Não é um diagnóstico.',
    retake: 'Responder de novo aos questionários',
    reasons: {
      risk_item:
        'Na sua última resposta, referiu ter pensado que seria melhor estar morto/a ou em magoar-se.',
      severe_result: 'Uma das suas últimas respostas ficou em alto.',
      anxiety: 'A sua última resposta sobre ansiedade ficou em moderado ou acima.',
      depression: 'A sua última resposta sobre desânimo ficou em moderado ou acima.',
      low_mood: 'O humor médio dos seus registos dos últimos 7 dias ficou baixo.',
      frequent_sleep: 'O sono apareceu em vários registos recentes.',
      work_pressure: 'O trabalho apareceu nos seus dias mais difíceis.',
      frequent_anxiety: 'A ansiedade apareceu em vários registos recentes.',
      night: 'É noite: um passo para descansar.',
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
    close: 'Fechar',
    phases: {
      inhale: 'Inspire',
      holdIn: 'Sustenha',
      exhale: 'Expire',
      holdOut: 'Espere',
    },
    round: 'Volta {current} de {total}',
    done: 'Pronto.',
    howNow: 'Como se sente agora?',
    more: 'Mais uma volta',
  },
}
