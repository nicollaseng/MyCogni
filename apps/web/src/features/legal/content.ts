export interface LegalSection {
  heading: string
  body: string
}

export interface LegalDocument {
  title: string
  summary: string
  sections: readonly LegalSection[]
}

export const privacySections = [
  'collected',
  'purpose',
  'legalBasis',
  'ai',
  'memories',
  'voice',
  'sharing',
  'rights',
] as const

export const termsSections = [
  'about',
  'cogni',
  'crisis',
  'account',
  'acceptableUse',
  'changes',
] as const
