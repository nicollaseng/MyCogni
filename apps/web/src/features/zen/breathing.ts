export const breathingPhases = ['inhale', 'holdIn', 'exhale', 'holdOut'] as const

export type BreathingPhase = (typeof breathingPhases)[number]

export const phaseSeconds = 4

export const breathingRounds = 4

const phaseMs = phaseSeconds * 1000

const roundMs = phaseMs * breathingPhases.length

export const exerciseMs = roundMs * breathingRounds

export interface BreathingMoment {
  phase: BreathingPhase
  side: number
  count: number
  round: number
  progress: number
}

export interface Point {
  x: number
  y: number
}

const corners: readonly Point[] = [
  { x: 0, y: 100 },
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
]

function cornerAt(index: number): Point {
  return corners[index % corners.length] ?? { x: 0, y: 100 }
}

export function momentAt(elapsedMs: number): BreathingMoment {
  const clamped = Math.min(Math.max(elapsedMs, 0), exerciseMs - 1)
  const inRound = clamped % roundMs
  const side = Math.floor(inRound / phaseMs)
  const inPhase = inRound % phaseMs
  return {
    phase: breathingPhases[side] ?? 'inhale',
    side,
    count: phaseSeconds - Math.floor(inPhase / 1000),
    round: Math.floor(clamped / roundMs) + 1,
    progress: inPhase / phaseMs,
  }
}

export function sideOf(side: number): { from: Point; to: Point } {
  return { from: cornerAt(side), to: cornerAt(side + 1) }
}

export function pointAt({ side, progress }: Pick<BreathingMoment, 'side' | 'progress'>): Point {
  const { from, to } = sideOf(side)
  return { x: from.x + (to.x - from.x) * progress, y: from.y + (to.y - from.y) * progress }
}
