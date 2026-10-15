import type { InstrumentTexts } from './instrument-text.ts'

const options = [
  'Nenhuma vez',
  'Vários dias',
  'Mais da metade dos dias',
  'Quase todos os dias',
] as const

export const brazilianPortuguese: InstrumentTexts = {
  phq9: {
    prompt:
      'Durante as últimas 2 semanas, com que frequência você foi incomodado/a por qualquer um dos problemas abaixo?',
    items: [
      'Pouco interesse ou pouco prazer em fazer as coisas',
      'Se sentir “para baixo”, deprimido/a ou sem perspectiva',
      'Dificuldade para pegar no sono ou permanecer dormindo, ou dormir mais do que de costume',
      'Se sentir cansado/a ou com pouca energia',
      'Falta de apetite ou comendo demais',
      'Se sentir mal consigo mesmo/a — ou achar que você é um fracasso ou que decepcionou sua família ou você mesmo/a',
      'Dificuldade para se concentrar nas coisas, como ler o jornal ou ver televisão',
      'Lentidão para se movimentar ou falar, a ponto das outras pessoas perceberem? Ou o oposto — estar tão agitado/a ou irrequieto/a que você fica andando de um lado para o outro muito mais do que de costume',
      'Pensar em se ferir de alguma maneira ou que seria melhor estar morto/a',
    ],
    options,
  },
  gad7: {
    prompt:
      'Durante as últimas 2 semanas, com que frequência você foi incomodado/a pelos problemas abaixo?',
    items: [
      'Sentir-se nervoso/a, ansioso/a ou muito tenso/a',
      'Não ser capaz de impedir ou de controlar as preocupações',
      'Preocupar-se muito com diversas coisas',
      'Dificuldade para relaxar',
      'Ficar tão agitado/a que se torna difícil permanecer sentado/a',
      'Ficar facilmente aborrecido/a ou irritado/a',
      'Sentir medo como se algo horrível fosse acontecer',
    ],
    options,
  },
}
