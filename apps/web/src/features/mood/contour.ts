export interface ContourOptions {
  rings: number
  valence: number
  time: number
}

const center = 150
const samples = 160
const referenceRings = 11

function mix(from: number, to: number, amount: number): number {
  return from + (to - from) * amount
}

export function ringRadius(ring: number, angle: number, options: ContourOptions): number {
  const { rings, valence, time } = options
  const tension = 1 - valence
  const amplitude = mix(0.03, 0.17, tension ** 1.4)
  const spacing = mix(13.5, 8.5, tension) * (referenceRings / rings)
  const breathing = 1 + Math.sin(time * 0.7) * mix(0.025, 0.008, tension)
  const calm =
    0.6 * Math.sin(3 * angle + ring * 0.7 + time * 0.5) +
    0.4 * Math.sin(2 * angle - ring * 1.1 - time * 0.35)
  const tense =
    0.55 * Math.sin(7 * angle + ring * 0.9 + time * 1.6) +
    0.45 * Math.sin(5 * angle - ring * 1.3 - time * 1.2)
  const wobble = amplitude * (valence * calm + tension * tense) * (0.55 + ring / rings)
  return (20 + ring * spacing) * breathing * (1 + wobble)
}

export function contourPath(ring: number, options: ContourOptions): string {
  const points: string[] = []
  for (let sample = 0; sample < samples; sample++) {
    const angle = (sample / samples) * Math.PI * 2
    const radius = ringRadius(ring, angle, options)
    const x = center + Math.cos(angle) * radius
    const y = center + Math.sin(angle) * radius
    points.push(`${x.toFixed(1)} ${y.toFixed(1)}`)
  }
  return `M${points.join('L')}Z`
}

export function ringOpacity(ring: number, rings: number): number {
  return mix(0.95, 0.22, ring / Math.max(rings - 1, 1))
}
