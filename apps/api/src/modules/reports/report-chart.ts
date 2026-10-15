import { maxMoodLevel } from '@mycogni/domain'
import { moodColor, palette, type Layout } from './pdf-layout.ts'
import type { ChartPoint, ReportModel } from './report-model.ts'

const plotHeight = 138
const gutter = 66
const inset = 9
const labelGap = 8

interface Point {
  x: number
  y: number
  value: number
}

function segmentsOf(points: readonly (Point | null)[]): Point[][] {
  const segments: Point[][] = []
  let current: Point[] = []
  for (const point of points) {
    if (point === null) {
      if (current.length > 0) {
        segments.push(current)
      }
      current = []
    } else {
      current.push(point)
    }
  }
  if (current.length > 0) {
    segments.push(current)
  }
  return segments
}

function drawLine(layout: Layout, segment: readonly Point[]): void {
  const [first, ...rest] = segment
  if (first === undefined || rest.length === 0) {
    return
  }
  const { doc } = layout
  doc.save()
  doc.moveTo(first.x, first.y)
  for (const point of rest) {
    doc.lineTo(point.x, point.y)
  }
  doc
    .lineWidth(1.2)
    .lineJoin('round')
    .lineCap('round')
    .strokeColor(palette.muted)
    .strokeOpacity(0.55)
    .stroke()
  doc.restore()
}

function drawLabels(
  layout: Layout,
  points: readonly ChartPoint[],
  xOf: (index: number) => number,
  y: number,
): void {
  const right = layout.left + layout.width
  points.forEach((point, index) => {
    if (point.label === null) {
      return
    }
    const last = index === points.length - 1
    const style = {
      font: last ? 'sansMedium' : 'sans',
      size: 7.5,
      color: last ? palette.ink : palette.muted,
    } as const
    layout.doc.font(style.font).fontSize(style.size)
    const width = layout.doc.widthOfString(point.label)
    const x = Math.min(right - width, Math.max(layout.left, xOf(index) - width / 2))
    layout.write(point.label, style, { x, y, width: width + 1, single: true })
  })
}

export function drawMoodChart(layout: Layout, chart: ReportModel['chart']): void {
  const { doc } = layout
  const count = chart.points.length
  const plotLeft = layout.left + gutter
  const plotWidth = layout.width - gutter
  const top = layout.y
  const slot = plotWidth / count
  const xOf = (index: number) => plotLeft + slot * (index + 0.5)
  const yOf = (value: number) => top + inset + (1 - value / maxMoodLevel) * (plotHeight - inset * 2)

  doc.save()
  doc
    .rect(plotLeft + slot * (count - 1), top, slot, plotHeight)
    .fillOpacity(0.045)
    .fill(palette.ink)
  doc.restore()

  const levels = [
    { value: maxMoodLevel, label: chart.scale.top },
    { value: maxMoodLevel / 2, label: chart.scale.middle },
    { value: 0, label: chart.scale.bottom },
  ]
  for (const level of levels) {
    const y = yOf(level.value)
    doc
      .moveTo(plotLeft, y)
      .lineTo(plotLeft + plotWidth, y)
      .lineWidth(0.5)
      .strokeColor(palette.rule)
      .stroke()
    layout.write(
      level.label,
      { font: 'sans', size: 7.5, color: palette.muted },
      { x: layout.left, y: y - 4.6, width: gutter - 12, single: true },
    )
  }

  const points = chart.points.map((point, index) =>
    point.average === null ? null : { x: xOf(index), y: yOf(point.average), value: point.average },
  )
  for (const segment of segmentsOf(points)) {
    drawLine(layout, segment)
  }
  const radius = count <= 7 ? 4.2 : 3.1
  for (const point of points) {
    if (point !== null) {
      doc.circle(point.x, point.y, radius + 1.4).fill(palette.paper)
      doc.circle(point.x, point.y, radius).fill(moodColor(point.value / maxMoodLevel))
    }
  }

  drawLabels(layout, chart.points, xOf, top + plotHeight + labelGap)
  layout.y = top + plotHeight + labelGap + 14
}
