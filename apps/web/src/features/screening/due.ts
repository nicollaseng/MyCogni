const dayInMs = 24 * 60 * 60 * 1000

export const screeningIntervalDays = 14

export function daysSince(iso: string, now: Date): number {
  return Math.floor((now.getTime() - new Date(iso).getTime()) / dayInMs)
}

export function isScreeningDue(latestIso: string | undefined, now: Date): boolean {
  return latestIso === undefined || daysSince(latestIso, now) >= screeningIntervalDays
}
