export const riskLevels = ['none', 'watch', 'urgent'] as const

export type RiskLevel = (typeof riskLevels)[number]

export type SupportLevel = Exclude<RiskLevel, 'none'>

export function mergeRisk(...levels: readonly RiskLevel[]): RiskLevel {
  return levels.reduce<RiskLevel>(
    (highest, level) => (riskLevels.indexOf(level) > riskLevels.indexOf(highest) ? level : highest),
    'none',
  )
}

export function needsSupport(level: RiskLevel): level is SupportLevel {
  return level !== 'none'
}
