export const riskLevels = ['none', 'watch', 'urgent'] as const

export type RiskLevel = (typeof riskLevels)[number]

export const assistantModes = ['personal', 'professional'] as const

export type AssistantMode = (typeof assistantModes)[number]

export const assistantRoles = ['user', 'assistant', 'notice'] as const

export type AssistantRole = (typeof assistantRoles)[number]

export const assistantLimits = {
  messageLength: 1000,
  replyLength: 2400,
  historyMessages: 12,
  hourlyMessages: 30,
  dailyMessages: 150,
  conversations: 20,
  checkInDays: 90,
  defaultCheckInDays: 30,
  checkIns: 120,
  journalEntries: 5,
  journalExcerpt: 700,
  toolResultCharacters: 8000,
  toolRounds: 4,
  screeningRiskDays: 30,
} as const

export function mergeRisk(...levels: readonly RiskLevel[]): RiskLevel {
  return levels.reduce<RiskLevel>(
    (highest, level) => (riskLevels.indexOf(level) > riskLevels.indexOf(highest) ? level : highest),
    'none',
  )
}

export function needsSupport(level: RiskLevel): boolean {
  return level !== 'none'
}
