import type { InstrumentId, Severity } from '@mycogni/domain'

export const instrumentTopics: Record<InstrumentId, string> = {
  phq9: 'Sinais de depressão',
  gad7: 'Sinais de ansiedade',
}

export const severityLabels: Record<Severity, string> = {
  minimal: 'Mínima',
  mild: 'Leve',
  moderate: 'Moderada',
  moderately_severe: 'Moderadamente grave',
  severe: 'Grave',
}

export const severityGuidance: Record<Severity, string> = {
  minimal: 'Nada que peça atenção agora. Continue observando seus dias.',
  mild: 'Vale observar como isso muda nas próximas semanas.',
  moderate: 'Vale conversar com um profissional de saúde sobre como você tem se sentido.',
  moderately_severe: 'Recomendamos conversar com um profissional de saúde em breve.',
  severe: 'Recomendamos procurar um profissional de saúde o quanto antes.',
}
