export const questionnaireAreas = [
  'depression',
  'anxiety',
  'trauma',
  'attention',
  'distress',
] as const

export type QuestionnaireArea = (typeof questionnaireAreas)[number]

export const questionnaireInstruments = ['phq', 'gad', 'pcl5', 'asrs', 'kessler'] as const

export type QuestionnaireInstrument = (typeof questionnaireInstruments)[number]

export const questionnaireVariants = ['phq9', 'phq8', 'gad7', 'pcl5', 'asrs6', 'k10', 'k6'] as const

export type QuestionnaireVariant = (typeof questionnaireVariants)[number]

export const questionnaireUses = ['screening', 'severity', 'monitoring'] as const

export type QuestionnaireUse = (typeof questionnaireUses)[number]

export const satepsiStatuses = ['nao_privativo', 'nao_avaliado', 'nao_consta'] as const

export type SatepsiStatus = (typeof satepsiStatuses)[number]

export const satepsiCheckedOn = '2026-10-22'

export interface CatalogEntry {
  variant: QuestionnaireVariant
  instrument: QuestionnaireInstrument
  area: QuestionnaireArea
  name: string
  itemCount: number
  minutes: number
  uses: readonly QuestionnaireUse[]
  primary: boolean
  satepsi: SatepsiStatus
  satepsiCheckedOn: string
}

type Entry = Omit<CatalogEntry, 'variant' | 'satepsiCheckedOn'>

const entries: Readonly<Record<QuestionnaireVariant, Entry>> = {
  phq9: {
    instrument: 'phq',
    area: 'depression',
    name: 'PHQ-9',
    itemCount: 9,
    minutes: 3,
    uses: ['screening', 'severity', 'monitoring'],
    primary: true,
    satepsi: 'nao_privativo',
  },
  phq8: {
    instrument: 'phq',
    area: 'depression',
    name: 'PHQ-8',
    itemCount: 8,
    minutes: 3,
    uses: ['severity'],
    primary: false,
    satepsi: 'nao_consta',
  },
  gad7: {
    instrument: 'gad',
    area: 'anxiety',
    name: 'GAD-7',
    itemCount: 7,
    minutes: 2,
    uses: ['screening', 'severity', 'monitoring'],
    primary: true,
    satepsi: 'nao_avaliado',
  },
  pcl5: {
    instrument: 'pcl5',
    area: 'trauma',
    name: 'PCL-5',
    itemCount: 20,
    minutes: 7,
    uses: ['screening', 'severity', 'monitoring'],
    primary: true,
    satepsi: 'nao_consta',
  },
  asrs6: {
    instrument: 'asrs',
    area: 'attention',
    name: 'ASRS v1.1',
    itemCount: 6,
    minutes: 2,
    uses: ['screening'],
    primary: true,
    satepsi: 'nao_consta',
  },
  k10: {
    instrument: 'kessler',
    area: 'distress',
    name: 'K10',
    itemCount: 10,
    minutes: 3,
    uses: ['screening', 'monitoring'],
    primary: true,
    satepsi: 'nao_consta',
  },
  k6: {
    instrument: 'kessler',
    area: 'distress',
    name: 'K6',
    itemCount: 6,
    minutes: 2,
    uses: ['screening', 'monitoring'],
    primary: false,
    satepsi: 'nao_consta',
  },
}

export function isQuestionnaireVariant(value: unknown): value is QuestionnaireVariant {
  return questionnaireVariants.some((variant) => variant === value)
}

export function catalogEntryOf(variant: QuestionnaireVariant): CatalogEntry {
  return { variant, ...entries[variant], satepsiCheckedOn }
}

export const questionnaireCatalog: readonly CatalogEntry[] =
  questionnaireVariants.map(catalogEntryOf)

export function catalogOfArea(area: QuestionnaireArea): CatalogEntry[] {
  return questionnaireCatalog.filter((entry) => entry.area === area)
}
