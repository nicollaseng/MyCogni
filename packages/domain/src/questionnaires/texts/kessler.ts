import type { QuestionnaireText, QuestionnaireTexts } from './text.ts'

const k10English: QuestionnaireText = {
  title: 'K10+',
  instructions:
    'The following questions ask about how you have been feeling during the past 30 days. For each question, please circle the number that best describes how often you had this feeling.',
  lead: 'The following questions ask about how you have been feeling during the past 30 days.',
  stem: 'During that month, how often did you feel …',
  items: [
    '… tired out for no good reason?',
    '…nervous?',
    '…so nervous that nothing could calm you down?',
    '…hopeless?',
    '…restless or fidgety?',
    '…so restless that you could not sit still?',
    '…depressed?',
    '…so depressed that nothing could cheer you up?',
    '…that everything was an effort?',
    '…worthless?',
  ],
  standaloneItems: [],
  options: [
    { label: 'All of the time', value: 5 },
    { label: 'Most of the time', value: 4 },
    { label: 'Some of the time', value: 3 },
    { label: 'A little of the time', value: 2 },
    { label: 'None of the time', value: 1 },
  ],
  notice: 'Copyright © Ronald C. Kessler, PhD. All rights reserved.',
  source: {
    document:
      'K10+ Self-Administered (English), Harvard Medical School, National Comorbidity Survey',
    url: 'https://www.hcp.med.harvard.edu/ncs/ftpdir/k6/Self%20admin_K10.pdf',
    citation:
      'Kessler, R.C., Barker, P.R., Colpe, L.J., Epstein, J.F., Gfroerer, J.C., Hiripi, E., Howes, M.J, Normand, S-L.T., Manderscheid, R.W., Walters, E.E., Zaslavsky, A.M. (2003). Screening for serious mental illness in the general population. Archives of General Psychiatry, 60(2), 184-189.',
    licence:
      'Use of the K6 and K10 is free and does not require any formal permission or approval. We do ask that you please cite the below article and include the copyright when using these scales.',
    attribution: 'Copyright © Ronald C. Kessler, PhD. All rights reserved.',
    retrievedOn: '2026-10-22',
  },
}

const k10BrazilianPortuguese: QuestionnaireText = {
  title: 'K10+',
  instructions:
    'As questões seguintes perguntam sobre como você tem se sentido durante os últimos 30 dias. Para cada questão, por favor, circule o número que melhor descreve com que freqüência você se sentiu assim.',
  lead: 'As questões seguintes perguntam sobre como você tem se sentido durante os últimos 30 dias.',
  stem: 'Durante os últimos 30 dias, com que freqüência você se sentiu…',
  items: [
    '… exausto (a) sem um bom motivo?',
    '…nervoso (a)?',
    '…tão nervoso (a) que nada podia acalmá-lo (a)?',
    '…sem esperança?',
    '…inquieto (a) ou agitado (a)?',
    '…tão inquieto (a) que você não conseguia ficar parado (a)?',
    '…deprimido (a)?',
    '… tão deprimido (a) que nada conseguia animá-lo (a)?',
    'Durante os últimos 30 dias, com que freqüência você sentiu que tudo era um esforço?',
    '…sem valor?',
  ],
  standaloneItems: [8],
  options: [
    { label: 'O tempo todo', value: 5 },
    { label: 'A maior parte do tempo', value: 4 },
    { label: 'Parte do tempo', value: 3 },
    { label: 'Um pouco', value: 2 },
    { label: 'Nunca', value: 1 },
  ],
  notice: 'Copyright © Ronald C. Kessler, PhD. All rights reserved.',
  source: {
    document:
      'K10+ Portuguese (for use in Brazil), official translation, Harvard Medical School, National Comorbidity Survey',
    url: 'https://www.hcp.med.harvard.edu/ncs/ftpdir/k6/Portuguese_K10.pdf',
    citation:
      'Kessler, R.C., Barker, P.R., Colpe, L.J., Epstein, J.F., Gfroerer, J.C., Hiripi, E., Howes, M.J, Normand, S-L.T., Manderscheid, R.W., Walters, E.E., Zaslavsky, A.M. (2003). Screening for serious mental illness in the general population. Archives of General Psychiatry, 60(2), 184-189.',
    licence:
      'Use of the K6 and K10 is free and does not require any formal permission or approval. We do ask that you please cite the below article and include the copyright when using these scales. The translations of the K6 and K10 are posted for unrestricted use, with the same requirement to acknowledge the copyright and cite the above article.',
    attribution:
      'Copyright © Ronald C. Kessler, PhD. All rights reserved. Translation of this document was performed on behalf of the Composite International Diagnostic Interview Advisory Committee by Yuan-Pang Wang, MD, PhD, Clarice Gorenstein, PhD, and Laura Helena Andrade, MD, PhD, of the Institute and Department of Psychiatry, Medical School of University of Sao Paulo, Brazil; and Maria Carmen Viana, MD, PhD, of the Department of Social Medicine, Federal University of Espírito Santo, Brazil.',
    retrievedOn: '2026-10-22',
  },
}

const k6English: QuestionnaireText = {
  title: 'K6+',
  instructions:
    'The following questions ask about how you have been feeling during the past 30 days. For each question, please circle the number that best describes how often you had this feeling.',
  lead: 'The following questions ask about how you have been feeling during the past 30 days.',
  stem: 'During the past 30 days, about how often did you feel …',
  items: [
    '…nervous?',
    '…hopeless?',
    '…restless or fidgety?',
    '…so depressed that nothing could cheer you up?',
    '…that everything was an effort?',
    '…worthless?',
  ],
  standaloneItems: [],
  options: [
    { label: 'All of the time', value: 4 },
    { label: 'Most of the time', value: 3 },
    { label: 'Some of the time', value: 2 },
    { label: 'A little of the time', value: 1 },
    { label: 'None of the time', value: 0 },
  ],
  notice: 'Copyright © Ronald C. Kessler, PhD. All rights reserved.',
  source: {
    document:
      'K6+ Self-Administered (English), Harvard Medical School, National Comorbidity Survey',
    url: 'https://www.hcp.med.harvard.edu/ncs/ftpdir/k6/Self%20admin_K6.pdf',
    citation:
      'Kessler, R.C., Barker, P.R., Colpe, L.J., Epstein, J.F., Gfroerer, J.C., Hiripi, E., Howes, M.J, Normand, S-L.T., Manderscheid, R.W., Walters, E.E., Zaslavsky, A.M. (2003). Screening for serious mental illness in the general population. Archives of General Psychiatry, 60(2), 184-189.',
    licence:
      'Use of the K6 and K10 is free and does not require any formal permission or approval. We do ask that you please cite the below article and include the copyright when using these scales.',
    attribution: 'Copyright © Ronald C. Kessler, PhD. All rights reserved.',
    retrievedOn: '2026-10-22',
  },
}

export const k10Texts: QuestionnaireTexts = {
  en: k10English,
  'pt-BR': k10BrazilianPortuguese,
}

export const k6Texts: QuestionnaireTexts = {
  en: k6English,
}
