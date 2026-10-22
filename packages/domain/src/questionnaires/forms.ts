import type { PlainLevel } from '../assessments/plain.ts'
import { safetyItem } from '../assessments/screening-rules.ts'
import type { QuestionnaireVariant } from './catalog.ts'
import type { ScoreSource } from './sources.ts'
import { asrsShadedFrom } from './texts/asrs.ts'

export const bandIds = [
  'minimal',
  'mild',
  'moderate',
  'moderately_severe',
  'severe',
  'below_cutoff',
  'above_cutoff',
  'low_negative',
  'high_negative',
  'low_positive',
  'high_positive',
  'distress_low',
  'distress_moderate',
  'distress_high',
  'distress_very_high',
  'serious_distress',
] as const

export type BandId = (typeof bandIds)[number]

export const clusterIds = ['b', 'c', 'd', 'e'] as const

export type ClusterId = (typeof clusterIds)[number]

export interface ScoreBand {
  id: BandId
  min: number
  source: ScoreSource
}

export interface Cluster {
  id: ClusterId
  items: readonly number[]
  required: number
}

export interface ClusterRule {
  clusters: readonly Cluster[]
  endorsedFrom: number
  source: ScoreSource
}

export interface ShadedRule {
  from: readonly number[]
  positiveAt: number
  source: ScoreSource
}

export interface PlainThreshold {
  level: PlainLevel
  min: number
}

export interface QuestionnaireForm {
  variant: QuestionnaireVariant
  version: number
  values: readonly number[]
  bands: readonly [ScoreBand, ...ScoreBand[]]
  universalBands: boolean
  clusters: ClusterRule | null
  shaded: ShadedRule | null
  safetyItem: number | null
  suicideScreenFrom: number | null
  plain: readonly [PlainThreshold, ...PlainThreshold[]]
}

const frequency = [0, 1, 2, 3] as const

const severityBands = (source: ScoreSource): QuestionnaireForm['bands'] => [
  { id: 'minimal', min: 0, source },
  { id: 'mild', min: 5, source },
  { id: 'moderate', min: 10, source },
  { id: 'moderately_severe', min: 15, source },
  { id: 'severe', min: 20, source },
]

const severityPlain: QuestionnaireForm['plain'] = [
  { level: 'low', min: 0 },
  { level: 'mild', min: 5 },
  { level: 'moderate', min: 10 },
  { level: 'high', min: 15 },
]

const range = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, index) => from + index)

const pcl5CutOff = 36

export const questionnaireForms: Readonly<Record<QuestionnaireVariant, QuestionnaireForm>> = {
  phq9: {
    variant: 'phq9',
    version: 1,
    values: frequency,
    bands: severityBands('phq9_bands'),
    universalBands: true,
    clusters: null,
    shaded: null,
    safetyItem,
    suicideScreenFrom: null,
    plain: severityPlain,
  },
  phq8: {
    variant: 'phq8',
    version: 1,
    values: frequency,
    bands: severityBands('phq8_bands'),
    universalBands: true,
    clusters: null,
    shaded: null,
    safetyItem: null,
    suicideScreenFrom: null,
    plain: severityPlain,
  },
  gad7: {
    variant: 'gad7',
    version: 1,
    values: frequency,
    bands: [
      { id: 'minimal', min: 0, source: 'gad7_bands' },
      { id: 'mild', min: 5, source: 'gad7_bands' },
      { id: 'moderate', min: 10, source: 'gad7_bands' },
      { id: 'severe', min: 15, source: 'gad7_bands' },
    ],
    universalBands: true,
    clusters: null,
    shaded: null,
    safetyItem: null,
    suicideScreenFrom: null,
    plain: severityPlain,
  },
  pcl5: {
    variant: 'pcl5',
    version: 1,
    values: [0, 1, 2, 3, 4],
    bands: [
      { id: 'below_cutoff', min: 0, source: 'pcl5_cutoff_br' },
      { id: 'above_cutoff', min: pcl5CutOff, source: 'pcl5_cutoff_br' },
    ],
    universalBands: true,
    clusters: {
      clusters: [
        { id: 'b', items: range(0, 4), required: 1 },
        { id: 'c', items: range(5, 6), required: 1 },
        { id: 'd', items: range(7, 13), required: 2 },
        { id: 'e', items: range(14, 19), required: 2 },
      ],
      endorsedFrom: 2,
      source: 'pcl5_dsm5_rule',
    },
    shaded: null,
    safetyItem: null,
    suicideScreenFrom: pcl5CutOff,
    plain: [
      { level: 'low', min: 0 },
      { level: 'mild', min: 20 },
      { level: 'moderate', min: pcl5CutOff },
      { level: 'high', min: 60 },
    ],
  },
  asrs6: {
    variant: 'asrs6',
    version: 1,
    values: [0, 1, 2, 3, 4],
    bands: [
      { id: 'low_negative', min: 0, source: 'asrs_continuous' },
      { id: 'high_negative', min: 10, source: 'asrs_continuous' },
      { id: 'low_positive', min: 14, source: 'asrs_continuous' },
      { id: 'high_positive', min: 18, source: 'asrs_continuous' },
    ],
    universalBands: true,
    clusters: null,
    shaded: { from: asrsShadedFrom, positiveAt: 4, source: 'asrs_shaded' },
    safetyItem: null,
    suicideScreenFrom: null,
    plain: [
      { level: 'low', min: 0 },
      { level: 'mild', min: 10 },
      { level: 'moderate', min: 14 },
      { level: 'high', min: 18 },
    ],
  },
  k10: {
    variant: 'k10',
    version: 1,
    values: [1, 2, 3, 4, 5],
    bands: [
      { id: 'distress_low', min: 10, source: 'k10_abs' },
      { id: 'distress_moderate', min: 16, source: 'k10_abs' },
      { id: 'distress_high', min: 22, source: 'k10_abs' },
      { id: 'distress_very_high', min: 30, source: 'k10_abs' },
    ],
    universalBands: false,
    clusters: null,
    shaded: null,
    safetyItem: null,
    suicideScreenFrom: null,
    plain: [
      { level: 'low', min: 10 },
      { level: 'mild', min: 16 },
      { level: 'moderate', min: 22 },
      { level: 'high', min: 30 },
    ],
  },
  k6: {
    variant: 'k6',
    version: 1,
    values: [0, 1, 2, 3, 4],
    bands: [
      { id: 'below_cutoff', min: 0, source: 'k6_cutoff' },
      { id: 'serious_distress', min: 13, source: 'k6_cutoff' },
    ],
    universalBands: true,
    clusters: null,
    shaded: null,
    safetyItem: null,
    suicideScreenFrom: null,
    plain: [
      { level: 'low', min: 0 },
      { level: 'mild', min: 6 },
      { level: 'moderate', min: 13 },
      { level: 'high', min: 18 },
    ],
  },
}

export function instrumentVersionOf(variant: QuestionnaireVariant): string {
  return `${variant}@${String(questionnaireForms[variant].version)}`
}
