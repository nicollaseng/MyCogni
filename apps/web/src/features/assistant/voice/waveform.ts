export const waveformBars = 36

export const activeLevel = 0.14

const silence = 0.006

const loud = 0.2

const dotHeight = 4

const barHeightMax = 26

export function levelOf(samples: Uint8Array): number {
  if (samples.length === 0) {
    return 0
  }
  let sum = 0
  for (const sample of samples) {
    const centred = (sample - 128) / 128
    sum += centred * centred
  }
  const rms = Math.sqrt(sum / samples.length)
  const scaled = Math.min(Math.max((rms - silence) / (loud - silence), 0), 1)
  return Math.sqrt(scaled)
}

export function pushLevel(history: readonly number[], level: number): number[] {
  return [...history.slice(1 - waveformBars), level]
}

export function barHeight(level: number): number {
  return level < activeLevel
    ? dotHeight
    : Math.round(dotHeight + level * (barHeightMax - dotHeight))
}

export function formatElapsed(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds))
  return `${String(Math.floor(whole / 60))}:${String(whole % 60).padStart(2, '0')}`
}
