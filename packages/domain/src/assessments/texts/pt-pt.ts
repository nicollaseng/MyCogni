import type { InstrumentTexts } from './instrument-text.ts'

const options = [
  'Nunca',
  'Em vários dias',
  'Em mais de metade do número de dias',
  'Em quase todos os dias',
] as const

export const europeanPortuguese: InstrumentTexts = {
  depression: {
    prompt:
      'Durante os últimos 14 dias, em quantos foi afectado/a por algum dos seguintes problemas?',
    items: [
      'Tive pouco interesse ou prazer em fazer coisas',
      'Senti desânimo, desalento ou falta de esperança',
      'Tive dificuldade em adormecer ou em dormir sem interrupções, ou dormi demais',
      'Senti cansaço ou falta de energia',
      'Tive falta ou excesso de apetite',
      'Senti que não gosto de mim próprio/a — ou que sou um(a) falhado/a ou me desiludi a mim próprio/a ou à minha família',
      'Tive dificuldade em concentrar-me nas coisas, como ao ler o jornal ou ver televisão',
      'Movimentei-me ou falei tão lentamente que outras pessoas poderão ter notado. Ou o oposto: estive agitado/a a ponto de andar de um lado para o outro muito mais do que é habitual',
      'Pensei que seria melhor estar morto/a, ou em magoar-me a mim próprio/a de alguma forma',
    ],
    options,
  },
  anxiety: {
    prompt: 'Durante os últimos 14 dias, em quantos foi afectado/a pelos seguintes problemas?',
    items: [
      'Senti-me nervoso/a, ansioso/a ou irritado/a',
      'Fui incapaz de parar de me preocupar ou de controlar as preocupações',
      'Preocupei-me demais com diferentes assuntos',
      'Tive dificuldade em relaxar',
      'Estive tão inquieto/a que era difícil ficar sossegado/a',
      'Estive facilmente incomodado/a ou irritável',
      'Senti receio, como se algo terrível pudesse acontecer',
    ],
    options,
  },
}
