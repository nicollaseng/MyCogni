import type { MoodLevel } from '@/features/mood/mood-levels'

export const sections = {
  howItWorks: 'como-funciona',
  ai: 'ia',
  privacy: 'privacidade',
  faq: 'perguntas',
} as const

export type SectionKey = keyof typeof sections

export const sectionKeys: readonly SectionKey[] = ['howItWorks', 'ai', 'privacy', 'faq']

export const sampleFortnight: readonly MoodLevel[] = [2, 3, 3, 4, 2, 1, 3, 4, 4, 5, 3, 4, 5, 4]

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export interface WeekDay {
  day: DayKey
  mood: MoodLevel
  sleepHours: number
}

export const sampleWeek: readonly WeekDay[] = [
  { day: 'mon', mood: 4, sleepHours: 7.5 },
  { day: 'tue', mood: 3, sleepHours: 7 },
  { day: 'wed', mood: 1, sleepHours: 5 },
  { day: 'thu', mood: 4, sleepHours: 8 },
  { day: 'fri', mood: 5, sleepHours: 7.5 },
  { day: 'sat', mood: 1, sleepHours: 4.5 },
  { day: 'sun', mood: 4, sleepHours: 7 },
]

export const aiPrinciples = ['statistics', 'noDiagnosis', 'crisis', 'optional'] as const

export const privacyCommitments = ['sensitive', 'onlyYou', 'control', 'noSelling'] as const

export const questions = [
  'therapy',
  'instruments',
  'ai',
  'selling',
  'crisis',
  'deletion',
  'devices',
] as const
