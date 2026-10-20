export const breathingPhases = ['inhale', 'holdIn', 'exhale', 'holdOut'] as const

export type BreathingPhase = (typeof breathingPhases)[number]

export const phaseSeconds = 4

export const breathingRounds = 4

const phaseMs = phaseSeconds * 1000

export const roundMs = phaseMs * breathingPhases.length

export const exerciseMs = roundMs * breathingRounds

export interface BreathingMoment {
  phase: BreathingPhase
  count: number
  round: number
}

export function momentAt(elapsedMs: number, rounds: number = breathingRounds): BreathingMoment {
  const clamped = Math.min(Math.max(elapsedMs, 0), rounds * roundMs - 1)
  const inRound = clamped % roundMs
  const side = Math.floor(inRound / phaseMs)
  return {
    phase: breathingPhases[side] ?? 'inhale',
    count: phaseSeconds - Math.floor((inRound % phaseMs) / 1000),
    round: Math.floor(clamped / roundMs) + 1,
  }
}

export type BreathingStatus = 'idle' | 'running' | 'paused' | 'finished'

export interface BreathingRun {
  status: BreathingStatus
  rounds: number
  base: number
  since: number
  now: number
  run: number
}

export interface BreathingAction {
  type: 'start' | 'pause' | 'resume' | 'more' | 'tick'
  now: number
}

export const idleRun: BreathingRun = {
  status: 'idle',
  rounds: breathingRounds,
  base: 0,
  since: 0,
  now: 0,
  run: 0,
}

export function elapsedOf(run: BreathingRun): number {
  return run.status === 'running' ? run.base + run.now - run.since : run.base
}

function tick(run: BreathingRun, now: number): BreathingRun {
  if (run.status !== 'running') {
    return run
  }
  const total = run.rounds * roundMs
  const next = { ...run, now }
  return elapsedOf(next) >= total ? { ...next, status: 'finished', base: total } : next
}

export function advance(run: BreathingRun, { type, now }: BreathingAction): BreathingRun {
  switch (type) {
    case 'start':
      return { ...idleRun, status: 'running', since: now, now, run: run.run + 1 }
    case 'pause':
      return run.status === 'running'
        ? { ...run, status: 'paused', base: elapsedOf({ ...run, now }), now }
        : run
    case 'resume':
      return run.status === 'paused' ? { ...run, status: 'running', since: now, now } : run
    case 'more':
      return run.status === 'finished'
        ? { ...run, status: 'running', rounds: run.rounds + 1, since: now, now, run: run.run + 1 }
        : run
    case 'tick':
      return tick(run, now)
  }
}
