import type { Locale } from '@mycogni/domain'

export interface CrisisLine {
  phone: string
  display: string
  description: string
}

const crisisLinesByLocale: Readonly<Record<Locale, readonly CrisisLine[]>> = {
  'pt-BR': [
    { phone: '188', display: '188', description: 'CVV, 24 horas, gratuito' },
    { phone: '192', display: '192', description: 'SAMU, emergência' },
  ],
  'pt-PT': [
    {
      phone: '808242424',
      display: '808 24 24 24',
      description: 'SNS 24, opção 4: aconselhamento psicológico, 24 horas',
    },
    {
      phone: '213544545',
      display: '213 544 545',
      description: 'SOS Voz Amiga, todos os dias das 15h30 às 00h30',
    },
    { phone: '112', display: '112', description: 'Emergência' },
  ],
  'en-US': [
    {
      phone: '988',
      display: '988',
      description: 'Suicide & Crisis Lifeline, call or text, free, 24/7',
    },
    { phone: '911', display: '911', description: 'Emergency' },
  ],
  'en-GB': [
    { phone: '116123', display: '116 123', description: 'Samaritans, free, 24/7' },
    { phone: '999', display: '999', description: 'Emergency' },
  ],
}

export function crisisLinesFor(locale: Locale): readonly CrisisLine[] {
  return crisisLinesByLocale[locale]
}
