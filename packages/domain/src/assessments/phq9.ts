import type { Instrument } from './instrument.ts'

export const phq9: Instrument = {
  id: 'phq9',
  name: 'PHQ-9',
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
  bands: [
    { severity: 'minimal', min: 0 },
    { severity: 'mild', min: 5 },
    { severity: 'moderate', min: 10 },
    { severity: 'moderately_severe', min: 15 },
    { severity: 'severe', min: 20 },
  ],
  riskItemIndex: 8,
}
