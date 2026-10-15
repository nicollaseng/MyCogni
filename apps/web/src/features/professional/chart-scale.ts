export interface ChartPoint {
  index: number
  value: number
}

export type TooltipSide = 'left' | 'right'

const steps = [1, 2, 5, 10] as const

export function niceTicks(max: number, target = 4): number[] {
  if (max <= 0) {
    return Array.from({ length: target + 1 }, (_, index) => index)
  }
  const rough = max / target
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const multiplier = steps.find((step) => rough / magnitude <= step) ?? 10
  const step = Math.max(1, multiplier * magnitude)
  const top = Math.ceil(max / step) * step
  return Array.from({ length: top / step + 1 }, (_, index) => index * step)
}

export function percentOf(value: number, min: number, max: number): number {
  if (max <= min) {
    return 0
  }
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))
}

export function bandCenter(index: number, count: number): number {
  return ((index + 0.5) / count) * 100
}

export function indexAt(offset: number, width: number, count: number): number {
  if (width <= 0 || count <= 0) {
    return 0
  }
  return Math.min(count - 1, Math.max(0, Math.floor((offset / width) * count)))
}

export function segmentsOf(values: readonly (number | null)[]): ChartPoint[][] {
  const segments: ChartPoint[][] = []
  let current: ChartPoint[] = []
  values.forEach((value, index) => {
    if (value === null) {
      if (current.length > 0) {
        segments.push(current)
      }
      current = []
      return
    }
    current.push({ index, value })
  })
  if (current.length > 0) {
    segments.push(current)
  }
  return segments
}

export function axisLabelIndices(count: number, step: number): number[] {
  const indices: number[] = []
  for (let index = count - 1; index >= 0; index -= step) {
    indices.unshift(index)
  }
  return indices
}

export function tooltipSide(index: number, count: number): TooltipSide {
  return bandCenter(index, count) <= 55 ? 'right' : 'left'
}

export function movedIndex(current: number | null, key: string, count: number): number | null {
  const last = count - 1
  switch (key) {
    case 'ArrowLeft':
      return current === null ? last : Math.max(0, current - 1)
    case 'ArrowRight':
      return current === null ? last : Math.min(last, current + 1)
    case 'Home':
      return 0
    case 'End':
      return last
    default:
      return current
  }
}
