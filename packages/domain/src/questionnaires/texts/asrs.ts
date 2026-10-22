import type { QuestionnaireText, QuestionnaireTexts } from './text.ts'

const english: QuestionnaireText = {
  title: 'Adult Self-Report Scale-V1.1 (ASRS-V1.1) Screener',
  instructions:
    'Check the box that best describes how you have felt and conducted yourself over the past 6 months. Please give the completed questionnaire to your healthcare professional during your next appointment to discuss the results.',
  lead: 'Check the box that best describes how you have felt and conducted yourself over the past 6 months.',
  stem: null,
  items: [
    'How often do you have trouble wrapping up the final details of a project, once the challenging parts have been done?',
    'How often do you have difficulty getting things in order when you have to do a task that requires organization?',
    'How often do you have problems remembering appointments or obligations?',
    'When you have a task that requires a lot of thought, how often do you avoid or delay getting started?',
    'How often do you fidget or squirm with your hands or feet when you have to sit down for a long time?',
    'How often do you feel overly active and compelled to do things, like you were driven by a motor?',
  ],
  standaloneItems: [],
  options: [
    { label: 'Never', value: 0 },
    { label: 'Rarely', value: 1 },
    { label: 'Sometimes', value: 2 },
    { label: 'Often', value: 3 },
    { label: 'Very Often', value: 4 },
  ],
  notice: '© New York University and the President and Fellows of Harvard College',
  source: {
    document:
      'ASRS v1.1 6-Question Screener, English, patient-facing form (6Q_ASRS_ENGLISH_final.pdf), NYU licensing portal',
    url: 'https://license.tov.med.nyu.edu/download/5372',
    citation:
      'The 6-question Adult Self-Report Scale-Version1.1 (ASRS-V1.1) Screener is a subset of the 18-question Adult ADHD Self-Report Scale-Version1.1 (Adult ASRSV1.1) Symptom Checklist. © New York University and the President and Fellows of Harvard College.',
    licence:
      'The screener is freely available for clinical and non-clinical use, including commercial use, but does require attribution. This is an evidence-based tool, and as such no other modifications, other than creating electronic versions, are permitted.',
    attribution:
      'The 6-question Adult Self-Report Scale-Version1.1 (ASRS-V1.1) Screener is a subset of the 18-question Adult ADHD Self-Report Scale-Version1.1 (Adult ASRSV1.1) Symptom Checklist. © New York University and the President and Fellows of Harvard College.',
    retrievedOn: '2026-10-22',
  },
}

const brazilianPortuguese: QuestionnaireText = {
  title:
    'Escala de Auto-Avaliação para o Diagnóstico do Transtorno de Déficit de Atenção/Hiperatividade em Adultos Versão 1.1 (ASRS-V1.1)',
  instructions:
    'Assinale a alternativa que melhor descreve a forma como você tem se sentido e comportado nos últimos 6 meses. Por favor, entregue o questionário preenchido ao seu profissional de saúde durante a próxima consulta para discutir os resultados obtidos.',
  lead: 'Assinale a alternativa que melhor descreve a forma como você tem se sentido e comportado nos últimos 6 meses.',
  stem: null,
  items: [
    'Com que freqüência você sente dificuldade para finalizar os últimos detalhes de uma tarefa, depois de já ter feito as partes mais complicadas?',
    'Com que freqüência você sente dificuldade para manter as coisas em ordem quando precisa realizar uma tarefa que exige organização?',
    'Com que freqüência você tem problemas para se lembrar de compromissos ou obrigações?',
    'Quando precisa realizar uma tarefa que exige muita concentração, com que freqüência você evita ou atrasa o seu início?',
    'Com que freqüência você fica se mexendo na cadeira ou balançando as mãos ou os pés quando precisa ficar sentado(a) durante um longo período de tempo?',
    'Com que freqüência você se sente excessivamente ativo(a) e compelido(a) a fazer coisas, como se fosse conduzido(a) por um motor?',
  ],
  standaloneItems: [],
  options: [
    { label: 'Nunca', value: 0 },
    { label: 'Raramente', value: 1 },
    { label: 'Algumas vezes', value: 2 },
    { label: 'Freqüentemente', value: 3 },
    { label: 'Muito freqüentemente', value: 4 },
  ],
  notice: '© New York University and the President and Fellows of Harvard College',
  source: {
    document:
      'ASRS v1.1 6-Question Screener, Portuguese (for Brazil), patient-facing form (6Q_Portuguese (for Brazil)_final.pdf), NYU licensing portal',
    url: 'https://license.tov.med.nyu.edu/download/5357',
    citation:
      'The 6-question Adult Self-Report Scale-Version1.1 (ASRS-V1.1) Screener is a subset of the 18-question Adult ADHD Self-Report Scale-Version1.1 (Adult ASRSV1.1) Symptom Checklist. © New York University and the President and Fellows of Harvard College.',
    licence:
      'The screener is freely available for clinical and non-clinical use, including commercial use, but does require attribution. This is an evidence-based tool, and as such no other modifications, other than creating electronic versions, are permitted.',
    attribution:
      'The 6-question Adult Self-Report Scale-Version1.1 (ASRS-V1.1) Screener is a subset of the 18-question Adult ADHD Self-Report Scale-Version1.1 (Adult ASRSV1.1) Symptom Checklist. © New York University and the President and Fellows of Harvard College.',
    retrievedOn: '2026-10-22',
  },
}

const europeanPortuguese: QuestionnaireText = {
  title:
    'Escala de auto-avaliação da Perturbação de Hiperatividade e Défice de Atenção para o Adulto-V1.1 (ASRS-V1.1) - Rastreio',
  instructions:
    'Por favor, assinale a caixa que melhor descreve como se tem sentido ou comportado nos últimos 6 meses. Após completar esta lista entregue-a ao seu profissional de saúde para que possam analisá-la durante a próxima consulta.',
  lead: 'Por favor, assinale a caixa que melhor descreve como se tem sentido ou comportado nos últimos 6 meses.',
  stem: null,
  items: [
    'Com que frequência sente dificuldade em finalizar os detalhes de um projeto, após terminar as partes mais desafiantes?',
    'Com que frequência sente dificuldade em pôr as coisas em ordem quando tem de executar uma tarefa que exige organização?',
    'Com que frequência sente dificuldade em lembrar-se de compromissos ou obrigações?',
    'Com que frequência evita ou adia uma tarefa que exija muita concentração?',
    'Com que frequência fica inquieto(a) ou mexe repetidamente as mãos e os pés, quando tem de estar sentado(a) durante um longo período de tempo?',
    'Com que frequência se sente excessivamente ativo(a) e compelido(a) a fazer coisas, como se estivesse "ligado(a) à corrente"?',
  ],
  standaloneItems: [],
  options: [
    { label: 'Nunca', value: 0 },
    { label: 'Raramente', value: 1 },
    { label: 'Algumas vezes', value: 2 },
    { label: 'Frequentemente', value: 3 },
    { label: 'Muito frequentemente', value: 4 },
  ],
  notice: '© New York University and the President and Fellows of Harvard College',
  source: {
    document:
      'ASRS v1.1 6-Question Screener, Portuguese (Portugal), patient-facing form (6Q_Portuguese_Final.pdf), NYU licensing portal',
    url: 'https://license.tov.med.nyu.edu/download/5368',
    citation:
      'The 6-question Adult Self-Report Scale-Version1.1 (ASRS-V1.1) Screener is a subset of the 18-question Adult ADHD Self-Report Scale-Version1.1 (Adult ASRSV1.1) Symptom Checklist. © New York University and the President and Fellows of Harvard College.',
    licence:
      'The screener is freely available for clinical and non-clinical use, including commercial use, but does require attribution. This is an evidence-based tool, and as such no other modifications, other than creating electronic versions, are permitted.',
    attribution:
      'The 6-question Adult Self-Report Scale-Version1.1 (ASRS-V1.1) Screener is a subset of the 18-question Adult ADHD Self-Report Scale-Version1.1 (Adult ASRSV1.1) Symptom Checklist. © New York University and the President and Fellows of Harvard College.',
    retrievedOn: '2026-10-22',
  },
}

export const asrsShadedFrom = [2, 2, 2, 3, 3, 3] as const

export const asrsTexts: QuestionnaireTexts = {
  en: english,
  'pt-BR': brazilianPortuguese,
  'pt-PT': europeanPortuguese,
}
