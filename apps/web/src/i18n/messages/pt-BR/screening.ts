import { labelsFor } from '@mycogni/domain'

const labels = labelsFor('pt-BR')

export const screening = {
  title: 'Questionários',
  topics: labels.topics,
  severity: labels.severities,
  guidance: {
    minimal: 'Nada que peça atenção agora. Continue observando seus dias.',
    mild: 'Vale observar como isso muda nas próximas semanas.',
    moderate: 'Vale conversar com um profissional de saúde sobre como você tem se sentido.',
    moderately_severe: 'Recomendamos conversar com um profissional de saúde em breve.',
    severe: 'Recomendamos procurar um profissional de saúde o quanto antes.',
  },
  plain: {
    title: 'Ânimo e ansiedade',
    names: labels.plainNames,
    levels: labels.plainLevels,
    trend: {
      same: 'Igual à última vez',
      better: 'Melhor que da última vez',
      higher: 'Mais alto que da última vez',
    },
    level: '{name}: {level}',
  },
  questionnaire: {
    back: 'Voltar',
    progress: 'Pergunta {current} de {total}',
    reminder: 'Nas últimas 2 semanas',
    saving: 'Salvando suas respostas…',
    retry: 'Tentar de novo',
  },
  more: {
    title: {
      depression: 'Mais algumas perguntas sobre ânimo',
      anxiety: 'Mais algumas perguntas sobre ansiedade',
    },
    body: '{count, plural, =0 {Nenhuma pergunta a mais.} one {Mais # pergunta, uma por tela. Elas ajudam a entender melhor como você está.} other {Mais # perguntas, uma por tela. Elas ajudam a entender melhor como você está.}}',
    continue: 'Continuar',
  },
  results: {
    risk: 'Se pensar em se ferir de novo, ligue:',
  },
  support: {
    title: 'Obrigado por contar.',
    body: 'Você disse que, nas últimas duas semanas, pensou em se ferir ou que seria melhor estar morto/a. Isso é sério, e você não precisa passar por isso sem ajuda.',
    danger: 'Em perigo agora? Vá ao pronto-socorro mais próximo.',
    call: 'Ligar para o CVV',
    continue: 'Continuar o questionário',
  },
  retake: {
    close: 'Fechar',
    title: 'Como foram as últimas duas semanas?',
    firstTime:
      'Começa com 5 perguntas sobre ânimo e ansiedade, uma por tela. Às vezes vêm mais algumas.',
    since: 'Da última vez você respondeu em {date}. No fim, você vê o que mudou desde então.',
    honest: 'Não existe resposta certa. Responda pensando em como as coisas foram de verdade.',
    start: 'Começar',
    resultsTitle: 'Seus resultados de hoje.',
    disclaimer: 'É uma triagem, não um diagnóstico. Só um profissional pode avaliar o seu caso.',
    back: 'Voltar ao perfil',
    zen: 'Ver sugestões no Zen Space',
  },
  latest: {
    title: 'Ânimo e ansiedade',
    empty: 'Você ainda não respondeu os questionários.',
    answeredOn: 'Respondidos em {date}. É uma triagem, não um diagnóstico.',
    retake: 'Refazer os questionários',
    next: 'Sugerimos responder de novo a partir de {date}, para ver como você muda.',
    due: '{count, plural, =0 {Já se passaram # dias} one {Já se passou # dia} other {Já se passaram # dias}} desde as últimas respostas. Você já pode responder de novo.',
  },
  history: {
    title: 'Histórico',
    day: 'Dia',
  },
  errors: {
    save: 'Não conseguimos salvar suas respostas agora. Tente de novo em instantes.',
  },
}

export type ScreeningMessages = typeof screening
