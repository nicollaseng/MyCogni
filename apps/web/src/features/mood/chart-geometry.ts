import { maxMoodLevel } from '@mycogni/domain'

export const plotInset = 8

export function moodTop(level: number): string {
  const share = (maxMoodLevel - level) / maxMoodLevel
  return `calc(${String(plotInset)}px + ${share.toFixed(4)} * (100% - ${String(plotInset * 2)}px))`
}

export function slotCenter(index: number, slots: number): string {
  return `${(((index + 0.5) / slots) * 100).toFixed(4)}%`
}

export function linePaths(values: readonly (number | null)[]): string[] {
  const paths: string[] = []
  let current: string[] = []
  values.forEach((value, index) => {
    if (value === null) {
      if (current.length > 1) {
        paths.push(current.join(' '))
      }
      current = []
      return
    }
    const point = `${(index + 0.5).toFixed(2)} ${(maxMoodLevel - value).toFixed(2)}`
    current.push(current.length === 0 ? `M${point}` : `L${point}`)
  })
  if (current.length > 1) {
    paths.push(current.join(' '))
  }
  return paths
}
