import { labelsFor } from '@mycogni/domain'
import type { ScreeningMessages } from '../pt-BR/screening'

const labels = labelsFor('pt-PT')

export const screening: ScreeningMessages = {
  title: 'Questionários',
  topics: labels.instruments,
  severity: labels.severities,
  guidance: {
    minimal: 'Nada que peça atenção agora. Continue a observar os seus dias.',
    mild: 'Vale a pena observar como isto muda nas próximas semanas.',
    moderate: 'Vale a pena falar com um profissional de saúde sobre como se tem sentido.',
    moderately_severe: 'Recomendamos que fale com um profissional de saúde em breve.',
    severe: 'Recomendamos que procure um profissional de saúde o mais depressa possível.',
  },
  score: {
    outOf: 'de {max}',
  },
  comparison: {
    same: 'Igual a {day}',
    up: '{points, plural, one {# ponto} other {# pontos}} a mais do que em {day}',
    down: '{points, plural, one {# ponto} other {# pontos}} a menos do que em {day}',
  },
  questionnaire: {
    back: 'Voltar',
    progress: '{name} · {current} de {total}',
    saving: 'A guardar as suas respostas…',
    retry: 'Tentar novamente',
  },
  results: {
    risk: 'Se voltar a pensar em magoar-se, ligue:',
  },
  support: {
    title: 'Obrigado por partilhar.',
    body: 'Disse que, nas últimas duas semanas, pensou em magoar-se ou que seria melhor estar morto/a. Isto é sério, e não tem de passar por isto sem ajuda.',
    danger: 'Em perigo agora? Dirija-se à urgência do hospital mais próximo.',
    call: 'Ligar para o SNS 24',
    continue: 'Continuar o questionário',
  },
  retake: {
    close: 'Fechar',
    title: 'Como correram as últimas duas semanas?',
    firstTime: 'São 16 perguntas do PHQ-9 e do GAD-7, uma por ecrã.',
    since: 'Da última vez respondeu em {date}. No fim, vê o que mudou desde então.',
    honest: 'Não há respostas certas. Responda a pensar em como as coisas correram de verdade.',
    start: 'Começar',
    resultsTitle: 'Os seus resultados de hoje.',
    disclaimer: 'É um rastreio, não um diagnóstico. Só um profissional pode avaliar o seu caso.',
    back: 'Voltar ao perfil',
    zen: 'Ver sugestões no Zen Space',
  },
  latest: {
    title: 'Os seus questionários',
    empty: 'Ainda não respondeu ao PHQ-9 e ao GAD-7.',
    answeredOn: 'Respondidos em {date}. É um rastreio, não um diagnóstico.',
    retake: 'Responder novamente aos questionários',
    next: 'Sugerimos responder novamente a partir de {date}, para ver como vai mudando.',
    due: '{count, plural, one {Já passou # dia} other {Já passaram # dias}} desde as últimas respostas. Já pode responder novamente.',
  },
  history: {
    title: 'Histórico',
  },
  errors: {
    save: 'Não foi possível guardar as suas respostas agora. Tente novamente dentro de instantes.',
  },
}
