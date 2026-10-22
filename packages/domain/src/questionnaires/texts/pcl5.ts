import type { QuestionnaireText, QuestionnaireTexts } from './text.ts'

const english: QuestionnaireText = {
  title: 'PCL-5',
  instructions:
    'Below is a list of problems that people sometimes have in response to a very stressful experience. Keeping your worst event in mind, please read each problem carefully and then select one of the numbers to the right to indicate how much you have been bothered by that problem in the past month.',
  lead: 'Below is a list of problems that people sometimes have in response to a very stressful experience.',
  stem: 'In the past month, how much were you bothered by:',
  items: [
    'Repeated, disturbing, and unwanted memories of the stressful experience?',
    'Repeated, disturbing dreams of the stressful experience?',
    'Suddenly feeling or acting as if the stressful experience were actually happening again (as if you were actually back there reliving it)?',
    'Feeling very upset when something reminded you of the stressful experience?',
    'Having strong physical reactions when something reminded you of the stressful experience (for example, heart pounding, trouble breathing, sweating)?',
    'Avoiding memories, thoughts, or feelings related to the stressful experience?',
    'Avoiding external reminders of the stressful experience (for example, people, places, conversations, activities, objects, or situations)?',
    'Trouble remembering important parts of the stressful experience?',
    'Having strong negative beliefs about yourself, other people, or the world (for example, having thoughts such as: I am bad, there is something seriously wrong with me, no one can be trusted, the world is completely dangerous)?',
    'Blaming yourself or someone else for the stressful experience or what happened after it?',
    'Having strong negative feelings such as fear, horror, anger, guilt, or shame?',
    'Loss of interest in activities that you used to enjoy?',
    'Feeling distant or cut off from other people?',
    'Trouble experiencing positive feelings (for example, being unable to feel happiness or have loving feelings for people close to you)?',
    'Irritable behavior, angry outbursts, or acting aggressively?',
    'Taking too many risks or doing things that could cause you harm?',
    'Being “superalert” or watchful or on guard?',
    'Feeling jumpy or easily startled?',
    'Having difficulty concentrating?',
    'Trouble falling or staying asleep?',
  ],
  standaloneItems: [],
  options: [
    { label: 'Not at all', value: 0 },
    { label: 'A little bit', value: 1 },
    { label: 'Moderately', value: 2 },
    { label: 'Quite a bit', value: 3 },
    { label: 'Extremely', value: 4 },
  ],
  notice: null,
  source: {
    document:
      'PTSD Checklist for DSM-5 (PCL-5), Standard, past month, version date 29 August 2023, National Center for PTSD',
    url: 'https://www.ptsd.va.gov/professional/assessment/documents/PCL5_Standard_form.pdf',
    citation:
      'Weathers, F.W., Litz, B.T., Keane, T.M., Palmieri, P.A., Marx, B.P., & Schnurr, P.P. (2013). The PTSD Checklist for DSM-5 (PCL-5). [Measurement instrument.] Available from www.ptsd.va.gov.',
    licence:
      "This measure was developed by staff at VA's National Center for PTSD and is in the public domain and not copyrighted. In accordance with the American Psychological Association's ethical guidelines, this instrument is intended for use by qualified health professionals and researchers.",
    attribution:
      'Weathers, F.W., Litz, B.T., Keane, T.M., Palmieri, P.A., Marx, B.P., & Schnurr, P.P. (2013). The PTSD Checklist for DSM-5 (PCL-5). [Measurement instrument.] Available from www.ptsd.va.gov.',
    retrievedOn: '2026-10-22',
  },
}

const brazilianPortuguese: QuestionnaireText = {
  title: 'Lista de verificação do TEPT para o DSM-5',
  instructions:
    'Abaixo há uma lista de problemas que as pessoas às vezes apresentam em resposta a uma experiência muito estressante. Por favor, leia cuidadosamente cada problema e então circule um dos números à direita para indicar o quanto você tem sido incomodado por este problema no último mês.',
  lead: 'Abaixo há uma lista de problemas que as pessoas às vezes apresentam em resposta a uma experiência muito estressante.',
  stem: 'No último mês, quanto você foi incomodado por:',
  items: [
    'Lembranças indesejáveis, perturbadoras e repetitivas da experiência estressante?',
    'Sonhos perturbadores e repetitivos com a experiência estressante?',
    'De repente, sentindo ou agindo como se a experiência estressante estivesse, de fato, acontecendo de novo (como se você estivesse revivendo-a, de verdade, lá no passado)?',
    'Sentir-se muito chateado quando algo lembra você da experiência estressante?',
    'Ter reações físicas intensas quando algo lembra você da experiência estressante (por exemplo, coração apertado, dificuldades para respirar, suor excessivo)?',
    'Evitar lembranças, pensamentos, ou sentimentos relacionados à experiência estressante?',
    'Evitar lembranças externas da experiência estressante (por exemplo, pessoas, lugares, conversas, atividades, objetos ou situações)?',
    'Não conseguir se lembrar de partes importantes da experiência estressante?',
    'Ter crenças negativas intensas sobre você, outras pessoas ou o mundo (por exemplo, ter pensamentos tais como: “Eu sou ruim”, “existe algo seriamente errado comigo”, “ninguém é confiável”, “o mundo todo é perigoso”)?',
    'Culpar a si mesmo ou aos outros pela experiência estressante ou pelo que aconteceu depois dela?',
    'Ter sentimentos negativos intensos como medo, pavor, raiva, culpa ou vergonha?',
    'Perder o interesse em atividades que você costumava apreciar?',
    'Sentir-se distante ou isolado das outras pessoas?',
    'Dificuldades para vivenciar sentimentos positivos (por exemplo, ser incapaz de sentir felicidade ou sentimentos amorosos por pessoas próximas a você)?',
    'Comportamento irritado, explosões de raiva ou agir agressivamente?',
    'Correr muitos riscos ou fazer coisas que podem lhe causar algum mal?',
    'Ficar “super” alerta, vigilante ou de sobreaviso?',
    'Sentir-se apreensivo ou assustado facilmente?',
    'Ter dificuldades para se concentrar?',
    'Problemas para adormecer ou continuar dormindo?',
  ],
  standaloneItems: [],
  options: [
    { label: 'De modo nenhum', value: 0 },
    { label: 'Um pouco', value: 1 },
    { label: 'Moderadamente', value: 2 },
    { label: 'Muito', value: 3 },
    { label: 'Extremamente', value: 4 },
  ],
  notice: null,
  source: {
    document:
      'Lista de verificação do TEPT para o DSM-5, Annex 1 ("Sem Critério A"), Osório et al. 2017',
    url: 'https://www.scielo.br/j/rpc/a/fSDjRxQmMQfnJKXpYSX58Rg/?lang=en',
    citation:
      'Osório FL, Silva TDA, Santos RG, Chagas MHN, Chagas NMS, Sanches RF, Crippa JAS. Posttraumatic Stress Disorder Checklist for DSM-5 (PCL-5): transcultural adaptation of the Brazilian version. Arch Clin Psychiatry (São Paulo). 2017;44(1):10-9. doi:10.1590/0101-60830000000107',
    licence:
      'Open-access article under the Creative Commons Attribution License (CC BY 4.0). The article states: "The PCL-5, in its three forms, can be freely used in the target population."',
    attribution:
      'Osório FL, Silva TDA, Santos RG, Chagas MHN, Chagas NMS, Sanches RF, Crippa JAS. Posttraumatic Stress Disorder Checklist for DSM-5 (PCL-5): transcultural adaptation of the Brazilian version. Arch Clin Psychiatry (São Paulo). 2017;44(1):10-9. doi:10.1590/0101-60830000000107',
    retrievedOn: '2026-10-22',
  },
}

export const pcl5Texts: QuestionnaireTexts = {
  en: english,
  'pt-BR': brazilianPortuguese,
}
