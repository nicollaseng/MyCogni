import type { TrackTexts } from '../types.ts'

export const europeanTracks: TrackTexts = {
  'everyday-anxiety': {
    title: 'Ansiedade no dia a dia',
    summary:
      'Perceber o que a ansiedade faz no corpo e na cabeça, e praticar duas ferramentas simples para quando a preocupação toma conta do dia.',
    steps: {
      'read-anxiety-basics': {
        title: 'Ler: o que é a ansiedade, e o que não é',
        body: 'Um texto curto sobre a diferença entre a ansiedade de todos os dias e um quadro que pede ajuda.',
      },
      breathe: {
        title: 'Respirar em quadrado',
        body: 'Quatro ciclos de respiração 4-4-4-4, cerca de um minuto. Faça-o sentado/a, sem pressa.',
      },
      'read-worry-time': {
        title: 'Ler: a hora da preocupação',
        body: 'Como marcar um horário para as preocupações e devolver o resto do dia a si próprio/a.',
      },
      'write-worry': {
        title: 'Escrever no MyBook',
        body: 'Que preocupação voltou mais vezes esta semana? O que está ao seu alcance fazer quanto a ela, e o que não está?',
      },
      'check-in': {
        title: 'Registar como está',
        body: 'Faça um registo de humor depois de praticar. Com o tempo, consegue ver o que ajuda.',
      },
      reflect: {
        title: 'Refletir',
        body: 'Quando adiou uma preocupação para a hora marcada, ela chegou com a mesma força? O que mudou?',
      },
    },
  },
  'performance-anxiety': {
    title: 'Ansiedade de desempenho',
    summary:
      'Para exames, apresentações, entrevistas e avaliações no trabalho: perceber o nervosismo antes da hora e preparar-se sem fugir da situação.',
    steps: {
      'read-performance-anxiety': {
        title: 'Ler: ansiedade de desempenho',
        body: 'Porque é que o corpo acelera antes de ser avaliado/a, e o que costuma ajudar.',
      },
      'read-breathing': {
        title: 'Ler: respirar devagar e voltar ao presente',
        body: 'O que se sabe, e o que ainda não se sabe, sobre a respiração lenta e as técnicas de ancoragem.',
      },
      breathe: {
        title: 'Respirar em quadrado',
        body: 'Pratique agora, com calma, para ter a técnica à mão no dia.',
      },
      'write-prediction': {
        title: 'Escrever no MyBook',
        body: 'Pense na próxima situação em que vai ser avaliado/a. O que receia que aconteça? E o que é mais provável que aconteça?',
      },
      reflect: {
        title: 'Refletir depois',
        body: 'Depois da situação, compare: o que aconteceu de facto, ao lado do que previa?',
      },
      'check-in': {
        title: 'Registar como está',
        body: 'Faça um registo de humor no dia da situação, para acompanhar como lidou com ela.',
      },
    },
  },
  'low-mood': {
    title: 'Humor em baixo',
    summary:
      'Quando falta vontade e o bem-estar está em baixo: pequenas ações planeadas, uma de cada vez, e atenção ao que muda no humor.',
    steps: {
      'read-behavioural-activation': {
        title: 'Ler: agir antes da vontade',
        body: 'O que é a ativação comportamental e porque é que pequenas atividades planeadas ajudam o humor.',
      },
      'write-activities': {
        title: 'Escrever no MyBook',
        body: 'Escreva três atividades pequenas que lhe costumavam fazer bem ou que são importantes para si. Qual delas consegue fazer amanhã, e a que horas?',
      },
      'check-in': {
        title: 'Registar como está',
        body: 'Depois da atividade, faça um registo de humor. Não precisa de ter corrido bem; vale a pena anotar como foi.',
      },
      reflect: {
        title: 'Refletir',
        body: 'Como estava o seu humor antes e depois da atividade? Houve alguma diferença, mesmo pequena?',
      },
      questionnaires: {
        title: 'Acompanhar com os questionários',
        body: 'Responda ao PHQ-9 e ao GAD-7 de duas em duas semanas para ver como muda. É um rastreio, não um diagnóstico.',
      },
    },
  },
  'sleep-and-rest': {
    title: 'Sono e descanso',
    summary:
      'O sono e o humor andam juntos. Observar as suas noites, ajustar a rotina com pequenas mudanças e tirar as preocupações da cama.',
    steps: {
      'read-sleep-and-mood': {
        title: 'Ler: sono e humor',
        body: 'Como o sono afeta o humor e que hábitos têm mais evidência.',
      },
      'write-nights': {
        title: 'Escrever no MyBook',
        body: 'Como foram as suas últimas três noites? Anote a hora a que se deitou, a hora a que acordou e o que fez na última hora antes de dormir.',
      },
      breathe: {
        title: 'Respirar antes de se deitar',
        body: 'Alguns ciclos de respiração em quadrado para abrandar antes de apagar a luz.',
      },
      'read-worry-time': {
        title: 'Ler: a hora da preocupação',
        body: 'Uma forma de não levar as preocupações para a cama.',
      },
      reflect: {
        title: 'Refletir',
        body: 'Que pequena mudança na sua rotina de sono consegue manter durante uma semana?',
      },
    },
  },
  'seeking-help': {
    title: 'Quando procurar ajuda',
    summary:
      'Sinais de que é altura de procurar um profissional, onde encontrar ajuda agora e como se preparar para essa conversa. Este percurso não substitui atendimento.',
    steps: {
      'read-when-to-seek-help': {
        title: 'Ler: quando procurar ajuda',
        body: 'Sinais de ansiedade intensa, depressão e mudanças fortes de humor que pedem avaliação profissional.',
      },
      support: {
        title: 'Saber a quem recorrer',
        body: 'Se está em perigo ou a pensar em magoar-se, ligue agora. Não tem de passar por isto sem ajuda.',
      },
      'read-screening-not-diagnosis': {
        title: 'Ler: rastreio não é diagnóstico',
        body: 'O que os questionários da app mostram, e o que só uma avaliação profissional pode dizer.',
      },
      'write-for-professional': {
        title: 'Escrever no MyBook',
        body: 'O que gostaria de contar a um profissional? O que tem sentido, desde quando, o que piora e o que ajuda.',
      },
    },
  },
}
