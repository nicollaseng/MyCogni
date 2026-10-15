export const screening = {
  title: 'Questionários',
  topics: {
    phq9: 'Sinais de depressão',
    gad7: 'Sinais de ansiedade',
  },
  severity: {
    minimal: 'Mínima',
    mild: 'Leve',
    moderate: 'Moderada',
    moderately_severe: 'Moderadamente grave',
    severe: 'Grave',
  },
  guidance: {
    minimal: 'Nada que peça atenção agora. Continue observando seus dias.',
    mild: 'Vale observar como isso muda nas próximas semanas.',
    moderate: 'Vale conversar com um profissional de saúde sobre como você tem se sentido.',
    moderately_severe: 'Recomendamos conversar com um profissional de saúde em breve.',
    severe: 'Recomendamos procurar um profissional de saúde o quanto antes.',
  },
  score: {
    outOf: 'de {max}',
  },
  comparison: {
    same: 'Igual a {day}',
    up: '{points, plural, one {# ponto} other {# pontos}} a mais que em {day}',
    down: '{points, plural, one {# ponto} other {# pontos}} a menos que em {day}',
  },
  questionnaire: {
    back: 'Voltar',
    progress: '{name} · {current} de {total}',
    saving: 'Salvando suas respostas…',
    retry: 'Tentar de novo',
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
    firstTime: 'São 16 perguntas do PHQ-9 e do GAD-7, uma por tela.',
    since: 'Da última vez você respondeu em {date}. No fim, você vê o que mudou desde então.',
    honest: 'Não existe resposta certa. Responda pensando em como as coisas foram de verdade.',
    start: 'Começar',
    resultsTitle: 'Seus resultados de hoje.',
    disclaimer: 'É uma triagem, não um diagnóstico. Só um profissional pode avaliar o seu caso.',
    back: 'Voltar ao perfil',
  },
  latest: {
    title: 'Seus questionários',
    empty: 'Você ainda não respondeu o PHQ-9 e o GAD-7.',
    answeredOn: 'Respondidos em {date}. É uma triagem, não um diagnóstico.',
    retake: 'Refazer os questionários',
    next: 'Sugerimos responder de novo a partir de {date}, para ver como você muda.',
    due: '{count, plural, one {Já se passou # dia} other {Já se passaram # dias}} desde as últimas respostas. Você já pode responder de novo.',
  },
  history: {
    title: 'Histórico',
  },
  errors: {
    save: 'Não conseguimos salvar suas respostas agora. Tente de novo em instantes.',
  },
}

export type ScreeningMessages = typeof screening
