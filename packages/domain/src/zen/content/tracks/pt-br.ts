import type { TrackTexts } from '../types.ts'

export const brazilianTracks: TrackTexts = {
  'everyday-anxiety': {
    title: 'Ansiedade no dia a dia',
    summary:
      'Entender o que a ansiedade faz no corpo e na cabeça, e praticar duas ferramentas simples para quando a preocupação toma conta do dia.',
    steps: {
      'read-anxiety-basics': {
        title: 'Ler: o que é ansiedade, e o que não é',
        body: 'Um texto curto sobre a diferença entre a ansiedade de todo dia e um quadro que pede ajuda.',
      },
      breathe: {
        title: 'Respirar em quadrado',
        body: 'Quatro ciclos de respiração 4-4-4-4, cerca de um minuto. Faça sentado/a, sem pressa.',
      },
      'read-worry-time': {
        title: 'Ler: a hora da preocupação',
        body: 'Como marcar um horário para as preocupações e devolver o resto do dia para você.',
      },
      'write-worry': {
        title: 'Escrever no MyBook',
        body: 'Que preocupação voltou mais vezes nesta semana? O que está ao seu alcance fazer sobre ela, e o que não está?',
      },
      'check-in': {
        title: 'Registrar como você está',
        body: 'Faça um registro de humor depois de praticar. Com o tempo, dá para ver o que ajuda.',
      },
      reflect: {
        title: 'Refletir',
        body: 'Quando você adiou uma preocupação para a hora marcada, ela chegou com a mesma força? O que mudou?',
      },
    },
  },
  'performance-anxiety': {
    title: 'Ansiedade de desempenho',
    summary:
      'Para provas, apresentações, entrevistas e avaliações no trabalho: entender o nervosismo antes da hora e se preparar sem fugir da situação.',
    steps: {
      'read-performance-anxiety': {
        title: 'Ler: ansiedade de desempenho',
        body: 'Por que o corpo acelera antes de ser avaliado/a, e o que costuma ajudar.',
      },
      'read-breathing': {
        title: 'Ler: respirar devagar e voltar ao presente',
        body: 'O que se sabe, e o que ainda não se sabe, sobre respiração lenta e técnicas de ancoragem.',
      },
      breathe: {
        title: 'Respirar em quadrado',
        body: 'Pratique agora, com calma, para ter a técnica à mão no dia.',
      },
      'write-prediction': {
        title: 'Escrever no MyBook',
        body: 'Pense na próxima situação em que você vai ser avaliado/a. O que você teme que aconteça? E o que é mais provável que aconteça?',
      },
      reflect: {
        title: 'Refletir depois',
        body: 'Depois da situação, compare: o que aconteceu de fato, perto do que você previa?',
      },
      'check-in': {
        title: 'Registrar como você está',
        body: 'Faça um registro de humor no dia da situação, para acompanhar como você lidou.',
      },
    },
  },
  'low-mood': {
    title: 'Humor para baixo',
    summary:
      'Quando falta vontade e o bem-estar está baixo: pequenas ações planejadas, uma de cada vez, e atenção ao que muda no humor.',
    steps: {
      'read-behavioural-activation': {
        title: 'Ler: agir antes da vontade',
        body: 'O que é ativação comportamental e por que pequenas atividades planejadas ajudam o humor.',
      },
      'write-activities': {
        title: 'Escrever no MyBook',
        body: 'Liste três atividades pequenas que costumavam fazer bem a você ou que são importantes para você. Qual delas dá para fazer amanhã, e a que horas?',
      },
      'check-in': {
        title: 'Registrar como você está',
        body: 'Depois da atividade, faça um registro de humor. Não precisa ter sido ótimo; vale anotar como foi.',
      },
      reflect: {
        title: 'Refletir',
        body: 'Como estava seu humor antes e depois da atividade? Houve alguma diferença, mesmo pequena?',
      },
      questionnaires: {
        title: 'Acompanhar com os questionários',
        body: 'Responda às perguntas sobre ânimo e ansiedade a cada duas semanas para ver como você muda. É uma triagem, não um diagnóstico.',
      },
    },
  },
  'sleep-and-rest': {
    title: 'Sono e descanso',
    summary:
      'Sono e humor andam juntos. Observar suas noites, ajustar a rotina com mudanças pequenas e tirar as preocupações da cama.',
    steps: {
      'read-sleep-and-mood': {
        title: 'Ler: sono e humor',
        body: 'Como o sono afeta o humor e quais hábitos têm mais evidência.',
      },
      'write-nights': {
        title: 'Escrever no MyBook',
        body: 'Como foram suas últimas três noites? Anote a hora em que deitou, a hora em que acordou e o que fez na última hora antes de dormir.',
      },
      breathe: {
        title: 'Respirar antes de deitar',
        body: 'Alguns ciclos de respiração em quadrado para desacelerar antes de apagar a luz.',
      },
      'read-worry-time': {
        title: 'Ler: a hora da preocupação',
        body: 'Uma forma de não levar as preocupações para a cama.',
      },
      reflect: {
        title: 'Refletir',
        body: 'Qual mudança pequena na sua rotina de sono você consegue manter por uma semana?',
      },
    },
  },
  'seeking-help': {
    title: 'Quando buscar ajuda',
    summary:
      'Sinais de que é hora de procurar um profissional, onde encontrar ajuda agora e como se preparar para essa conversa. Esta trilha não substitui atendimento.',
    steps: {
      'read-when-to-seek-help': {
        title: 'Ler: quando buscar ajuda',
        body: 'Sinais de ansiedade intensa, depressão e mudanças fortes de humor que pedem avaliação profissional.',
      },
      support: {
        title: 'Saber a quem recorrer',
        body: 'Se você está em perigo ou pensando em se machucar, ligue agora. Você não precisa passar por isso sem ajuda.',
      },
      'read-screening-not-diagnosis': {
        title: 'Ler: triagem não é diagnóstico',
        body: 'O que os questionários do app mostram, e o que só uma avaliação profissional pode dizer.',
      },
      'write-for-professional': {
        title: 'Escrever no MyBook',
        body: 'O que você gostaria de contar a um profissional? O que tem sentido, desde quando, o que piora e o que ajuda.',
      },
    },
  },
}
