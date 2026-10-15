import { messageRisk } from './crisis-detector.ts'
import { riskLevels, type RiskLevel } from './risk.ts'

export function noteRisk(text: string | null): RiskLevel {
  return text === null ? 'none' : messageRisk(text).level
}

export function raisedRisk(before: string, after: string): RiskLevel {
  const current = noteRisk(after)
  return riskLevels.indexOf(current) > riskLevels.indexOf(noteRisk(before)) ? current : 'none'
}
