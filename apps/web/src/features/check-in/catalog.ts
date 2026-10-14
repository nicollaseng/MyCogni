export interface ChoiceGroup {
  id: string
  title: string
  items: readonly string[]
}

export interface EmotionFamily extends ChoiceGroup {
  valence: number
}

export const emotionFamilies: readonly EmotionFamily[] = [
  {
    id: 'anxiety',
    title: 'ansiedade',
    valence: 0.15,
    items: [
      'ansiedade',
      'preocupação',
      'medo',
      'nervosismo',
      'insegurança',
      'inquietação',
      'apreensão',
      'pânico',
    ],
  },
  {
    id: 'sadness',
    title: 'tristeza',
    valence: 0.1,
    items: [
      'tristeza',
      'desânimo',
      'solidão',
      'saudade',
      'vazio',
      'decepção',
      'desesperança',
      'culpa',
      'vergonha',
    ],
  },
  {
    id: 'anger',
    title: 'raiva',
    valence: 0.2,
    items: ['raiva', 'irritação', 'frustração', 'impaciência', 'ressentimento', 'ciúme'],
  },
  {
    id: 'exhaustion',
    title: 'cansaço',
    valence: 0.3,
    items: ['cansaço', 'sobrecarga', 'estresse', 'exaustão', 'apatia'],
  },
  {
    id: 'mixed',
    title: 'misto',
    valence: 0.5,
    items: ['confusão', 'indiferença', 'tédio', 'nostalgia', 'surpresa', 'ambivalência'],
  },
  {
    id: 'calm',
    title: 'calma',
    valence: 0.75,
    items: ['calma', 'tranquilidade', 'alívio', 'paz', 'contentamento', 'satisfação', 'segurança'],
  },
  {
    id: 'energy',
    title: 'energia',
    valence: 0.8,
    items: ['motivação', 'foco', 'disposição', 'inspiração', 'curiosidade', 'coragem'],
  },
  {
    id: 'connection',
    title: 'conexão',
    valence: 0.85,
    items: ['gratidão', 'amor', 'carinho', 'pertencimento', 'acolhimento', 'compaixão'],
  },
  {
    id: 'joy',
    title: 'alegria',
    valence: 0.9,
    items: [
      'alegria',
      'felicidade',
      'entusiasmo',
      'empolgação',
      'diversão',
      'esperança',
      'orgulho',
      'confiança',
    ],
  },
]

export const contextGroups: readonly ChoiceGroup[] = [
  {
    id: 'body',
    title: 'corpo',
    items: [
      'sono',
      'alimentação',
      'exercício',
      'saúde',
      'dor',
      'ciclo menstrual',
      'medicação',
      'álcool',
    ],
  },
  {
    id: 'people',
    title: 'pessoas',
    items: ['família', 'parceria', 'amizades', 'filhos', 'colegas', 'pets'],
  },
  {
    id: 'routine',
    title: 'rotina',
    items: ['trabalho', 'estudos', 'dinheiro', 'casa', 'deslocamento', 'tempo livre'],
  },
  { id: 'world', title: 'mundo', items: ['notícias', 'redes sociais', 'clima', 'cidade'] },
  { id: 'inner', title: 'por dentro', items: ['autoestima', 'propósito', 'fé', 'terapia'] },
]

export const contextTabs: readonly ChoiceGroup[] = [
  {
    id: 'suggestions',
    title: 'sugestões',
    items: [
      'sono',
      'trabalho',
      'família',
      'saúde',
      'dinheiro',
      'parceria',
      'amizades',
      'exercício',
    ],
  },
  ...contextGroups,
]
