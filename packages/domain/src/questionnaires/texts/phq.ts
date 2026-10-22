import { english } from '../../assessments/texts/en.ts'
import type { InstrumentText } from '../../assessments/texts/instrument-text.ts'
import { brazilianPortuguese } from '../../assessments/texts/pt-br.ts'
import { europeanPortuguese } from '../../assessments/texts/pt-pt.ts'
import type { QuestionnaireText, QuestionnaireTexts, TextLocale } from './text.ts'

interface OfficialForm {
  title: string
  instructions: string
  url: string
  footer: string
}

type FormsByLocale = Readonly<Record<TextLocale, OfficialForm>>

const phq9Forms: FormsByLocale = {
  'pt-BR': {
    title: 'QUESTIONÁRIO SOBRE A SAÚDE DO/A PACIENTE- (PHQ-9)',
    instructions:
      'Durante as últimas 2 semanas, com que freqüência você foi incomodado/a por qualquer um dos problemas abaixo?\n(Marque sua resposta com “✔” )',
    url: 'https://www.phqscreeners.com/images/sites/g/files/g10060481/f/201412/PHQ9_Portuguese%20for%20Brazil.pdf',
    footer:
      'Desenvolvido pelos Drs. Robert L. Spitzer, Janet B.W. Williams, Kurt Kroenke e colegas, com um subsídio educacional da Pfizer Inc. Não é necessária permissão para reproduzir, traduzir, exibir ou distribuir.',
  },
  'pt-PT': {
    title: 'QUESTIONÁRIO SOBRE A SAÚDE DO PACIENTE-9 (PHQ-9)',
    instructions:
      'Durante os últimos 14 dias, em quantos foi afectado/a por algum dos seguintes problemas?\n(Utilize"✔" para indicar a sua resposta)',
    url: 'https://www.phqscreeners.com/images/sites/g/files/g10060481/f/201412/PHQ9_Portuguese%20for%20Portugal.pdf',
    footer:
      'Desenvolvido por Robert L. Spitzer, Janet B.W. Williams, Kurt Kroenke e colegas, com uma bolsa de estudos da Pfizer Inc. Não é necessária permissão para reproduzir, traduzir, exibir ou distribuir.',
  },
  en: {
    title: 'PATIENT HEALTH QUESTIONNAIRE-9 (PHQ-9)',
    instructions:
      'Over the last 2 weeks, how often have you been bothered by any of the following problems?\n(Use “✔” to indicate your answer)',
    url: 'https://www.phqscreeners.com/images/sites/g/files/g10060481/f/201412/PHQ-9_English.pdf',
    footer:
      'Developed by Drs. Robert L. Spitzer, Janet B.W. Williams, Kurt Kroenke and colleagues, with an educational grant from Pfizer Inc. No permission required to reproduce, translate, display or distribute.',
  },
}

const gad7Forms: FormsByLocale = {
  'pt-BR': {
    title: 'GAD-7',
    instructions:
      'Durante as últimas 2 semanas, com que freqüência você foi incomodado/a pelos problemas abaixo?\n(Marque sua resposta com “✔” )',
    url: 'https://www.phqscreeners.com/images/sites/g/files/g10060481/f/201412/GAD7_Portuguese%20for%20Brazil.pdf',
    footer:
      'Desenvolvido pelos Drs. Robert L. Spitzer, Janet B.W. Williams, Kurt Kroenke e colegas, com um subsídio educacional da Pfizer Inc. Não é necessária permissão para reproduzir, traduzir, exibir ou distribuir.',
  },
  'pt-PT': {
    title: 'GAD-7',
    instructions:
      'Durante os últimos 14 dias, em quantos foi afectado/a pelos seguintes problemas?\n(Utilize"✔" para indicar a sua resposta)',
    url: 'https://www.phqscreeners.com/images/sites/g/files/g10060481/f/201412/GAD7_Portuguese%20for%20Portugal.pdf',
    footer:
      'Desenvolvido por Robert L. Spitzer, Janet B.W. Williams, Kurt Kroenke e colegas, com uma bolsa de estudos da Pfizer Inc. Não é necessária permissão para reproduzir, traduzir, exibir ou distribuir.',
  },
  en: {
    title: 'GAD-7',
    instructions:
      'Over the last 2 weeks, how often have you been bothered by the following problems?\n(Use “✔” to indicate your answer)',
    url: 'https://www.phqscreeners.com/images/sites/g/files/g10060481/f/201412/GAD7_English%20for%20the%20USA_0.pdf',
    footer:
      'Developed by Drs. Robert L. Spitzer, Janet B.W. Williams, Kurt Kroenke and colleagues, with an educational grant from Pfizer Inc. No permission required to reproduce, translate, display or distribute.',
  },
}

const onboardingTexts = {
  'pt-BR': brazilianPortuguese,
  'pt-PT': europeanPortuguese,
  en: english,
} as const

const licence =
  'All of the measures included in Table 1 are in the public domain. No permission is required to reproduce, translate, display or distribute. (PHQ Instruction Manual, Pfizer: https://www.phqscreeners.com/images/sites/g/files/g10016261/f/201412/instructions.pdf)'

const phq8Derivation =
  'PHQ-8: all items of the PHQ-9 except the 9th item on self-harm. The abbreviated versions can simply be derived from the translations by selecting the relevant items (PHQ Instruction Manual, Table 1 and p. 7).'

const citations = {
  phq9: 'Kroenke K, Spitzer RL, Williams JBW. The PHQ-9: Validity of a brief depression severity measure. J Gen Intern Med 2001;16:606-613.',
  phq8: 'Kroenke K, et al. The PHQ-8 as a measure of current depression in the general population. J Affect Disord 2009;114:163-173.',
  gad7: 'Spitzer RL, Kroenke K, Williams JBW, Löwe B. A brief measure for assessing generalized anxiety disorder: the GAD-7. Arch Intern Med 2006;166:1092-1097.',
}

function textOf(
  form: OfficialForm,
  text: InstrumentText,
  citation: string,
  items: readonly string[],
): QuestionnaireText {
  return {
    title: form.title,
    instructions: form.instructions,
    lead: text.prompt,
    stem: null,
    items,
    standaloneItems: [],
    options: text.options.map((label, value) => ({ label, value })),
    notice: null,
    source: {
      document: form.title,
      url: form.url,
      citation,
      licence,
      attribution: form.footer,
      retrievedOn: '2026-10-22',
    },
  }
}

function textsFor(build: (locale: TextLocale) => QuestionnaireText): QuestionnaireTexts {
  return { 'pt-BR': build('pt-BR'), 'pt-PT': build('pt-PT'), en: build('en') }
}

export const phq9Texts = textsFor((locale) => {
  const text = onboardingTexts[locale].depression
  return textOf(phq9Forms[locale], text, citations.phq9, text.items)
})

export const phq8Texts = textsFor((locale) => {
  const text = onboardingTexts[locale].depression
  const full = textOf(phq9Forms[locale], text, citations.phq8, text.items.slice(0, 8))
  return {
    ...full,
    title: 'PHQ-8',
    source: { ...full.source, document: `${full.source.document}. ${phq8Derivation}` },
  }
})

export const gad7Texts = textsFor((locale) => {
  const text = onboardingTexts[locale].anxiety
  return textOf(gad7Forms[locale], text, citations.gad7, text.items)
})
