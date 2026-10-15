export const insightCheckInThreshold = 7

export const insightAudiences = ['patient', 'professional'] as const

export type InsightAudience = (typeof insightAudiences)[number]

export const insightAttentionLevels = ['none', 'watch', 'urgent'] as const

export type InsightAttention = (typeof insightAttentionLevels)[number]

export const insightLookbackDays = 30

export function isInsightDue(checkInsSinceLastInsight: number): boolean {
  return checkInsSinceLastInsight >= insightCheckInThreshold
}
