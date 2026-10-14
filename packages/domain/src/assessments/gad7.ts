import type { Instrument } from './instrument.ts'

export const gad7: Instrument = {
  id: 'gad7',
  name: 'GAD-7',
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
  bands: [
    { severity: 'minimal', min: 0 },
    { severity: 'mild', min: 5 },
    { severity: 'moderate', min: 10 },
    { severity: 'severe', min: 15 },
  ],
  riskItemIndex: null,
}
