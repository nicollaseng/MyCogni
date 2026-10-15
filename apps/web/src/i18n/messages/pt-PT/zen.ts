import type { ZenMessages } from '../pt-BR/zen'

export const zen: ZenMessages = {
  meta: {
    title: 'Zen Space',
  },
  title: 'Zen Space',
  description:
    'Leituras curtas, percursos e exercícios para cuidar da cabeça ao seu ritmo, com base no que a ciência sabe hoje.',
  disclaimer: 'Conteúdo educativo, não substitui acompanhamento profissional.',
  forYou: {
    title: 'Para si agora',
    kicker: 'Percurso sugerido',
    progress: '{done} de {total} passos',
    start: 'Começar o percurso',
    continue: 'Continuar o percurso',
    review: 'Rever o percurso',
    also: 'Também pode ajudar',
    readings: 'Leituras sugeridas',
    why: 'Porquê estas sugestões?',
    rules:
      'As sugestões seguem regras simples sobre os seus questionários mais recentes e os seus registos dos últimos 7 dias. Não são um diagnóstico.',
    reasons: {
      risk_item:
        'No seu PHQ-9 mais recente, referiu ter pensado que seria melhor estar morto/a ou em magoar-se.',
      severe_result:
        'Um dos seus questionários mais recentes ficou no nível grave ou moderadamente grave.',
      anxiety: 'O seu GAD-7 mais recente ficou no nível moderado ou acima.',
      depression: 'O seu PHQ-9 mais recente ficou no nível moderado ou acima.',
      low_mood: 'O humor médio dos seus registos dos últimos 7 dias ficou baixo.',
      starting:
        'Nada nos seus resultados recentes pede atenção agora. O sono é um bom ponto de partida para cuidar do humor.',
    },
  },
  help: {
    title: 'Cuide disto com alguém',
    body: 'Os seus resultados recentes pedem atenção. Fale com um profissional de saúde sobre como se tem sentido. Se estiver em perigo agora, ligue:',
    professional: '{name} acompanha os seus registos. Vale a pena contar a {name} o que mudou.',
  },
  tracks: {
    title: 'Percursos',
    status: {
      new: 'Por começar',
      started: '{done} de {total} passos',
      complete: 'Concluído',
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
    helpTitle: 'Contactos de ajuda',
  },
  track: {
    back: 'Zen Space',
    kicker: 'Percurso · {count, plural, one {# passo} other {# passos}}',
    progress: '{done} de {total} passos feitos',
    step: 'Passo {number}',
    done: 'Feito',
    markDone: 'Marcar como feito',
    saving: 'A guardar…',
    saveError: 'Não foi possível guardar agora. Tente de novo dentro de instantes.',
    writeError:
      'Não foi possível abrir uma página no MyBook agora. Tente de novo dentro de instantes.',
    opening: 'A abrir o MyBook…',
    complete: 'Concluiu este percurso. Volte a ele quando quiser.',
    actions: {
      read: 'Ler',
      breathe: 'Começar o exercício',
      write: 'Escrever no MyBook',
      check_in: 'Fazer um registo',
      questionnaire: 'Responder aos questionários',
    },
    reflectHint: 'Pense nisto com calma. Se quiser, escreva a resposta no MyBook.',
  },
  breathing: {
    title: 'Respirar em quadrado',
    intro:
      'Inspire, sustenha, expire e espere, a contar até quatro em cada parte. Quatro voltas demoram cerca de um minuto. Se sentir tonturas, volte a respirar normalmente.',
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
