import { maxMoodLevel } from '@mycogni/domain'
import PDFDocument from 'pdfkit'
import {
  createLayout,
  fontPath,
  moodColor,
  palette,
  registerFonts,
  sheet,
  type Layout,
} from './pdf-layout.ts'
import { drawMoodChart } from './report-chart.ts'
import type {
  ReadingItem,
  ReportModel,
  ReportReadingModel,
  ScreeningRow,
  TagColumn,
} from './report-model.ts'

const itemStyle = { font: 'sans', size: 9.5, lineGap: 2.2 } as const

const noteStyle = { font: 'serif', size: 10.5, lineGap: 2.6 } as const

const columnGap = 28

const tagRowHeight = 28
const sectionGap = 30

function sectionTitle(layout: Layout, title: string, firstBlock: number): void {
  layout.ensure(26 + firstBlock)
  layout.write(title, { font: 'display', size: 15.5, tracking: -0.15 })
  layout.y += 9
}

function quiet(layout: Layout, text: string): void {
  layout.write(text, { font: 'sans', size: 9, color: palette.muted, lineGap: 2 })
}

function drawHeader(layout: Layout, model: ReportModel): void {
  const { header } = model
  const top = layout.y
  layout.write(
    'MyCogniAI',
    { font: 'displayMedium', size: 15, tracking: -0.3 },
    { y: top, single: true },
  )
  layout.write(
    header.generated,
    { font: 'sans', size: 8.5, color: palette.muted },
    { y: top + 4, align: 'right', single: true },
  )
  layout.rule(top + 26)
  layout.y = top + 54
  layout.write(`${model.title} · ${header.scope}`, {
    font: 'sans',
    size: 9.5,
    color: palette.muted,
  })
  layout.y += 6
  layout.write(header.name, { font: 'display', size: 32, tracking: -0.6, lineGap: -2 })
  layout.y += 6
  layout.write(header.period, { font: 'sans', size: 10.5 })
  layout.y += 30
}

function drawKpis(layout: Layout, model: ReportModel): void {
  const width = (layout.width - columnGap * 2) / 3
  const labelHeight = Math.max(
    ...model.kpis.map((kpi) =>
      layout.measure(kpi.label, { font: 'sans', size: 8.5, lineGap: 1.5 }, width),
    ),
  )
  const top = layout.y
  let bottom = top
  model.kpis.forEach((kpi, index) => {
    const x = layout.left + index * (width + columnGap)
    layout.write(
      kpi.label,
      { font: 'sans', size: 8.5, color: palette.muted, lineGap: 1.5 },
      { x, y: top, width },
    )
    const valueTop = top + labelHeight + 4
    layout.write(
      kpi.value,
      { font: 'display', size: 27, tracking: -0.4 },
      { x, y: valueTop, width, single: true },
    )
    const detailTop = valueTop + 36
    const detailHeight = layout.write(
      kpi.detail,
      { font: 'sans', size: 8.5, color: palette.muted, lineGap: 1.5 },
      { x, y: detailTop, width },
    )
    bottom = Math.max(bottom, detailTop + detailHeight)
  })
  layout.y = bottom + sectionGap
}

function drawChart(layout: Layout, model: ReportModel): void {
  const { chart } = model
  sectionTitle(layout, chart.title, 190)
  quiet(layout, chart.caption)
  layout.y += 14
  if (chart.empty === null) {
    drawMoodChart(layout, chart)
  } else {
    layout.write(chart.empty, { font: 'serifItalic', size: 11, color: palette.muted })
  }
  layout.y += sectionGap - 8
}

function drawTagColumn(
  layout: Layout,
  column: TagColumn,
  x: number,
  top: number,
  width: number,
): number {
  const { doc } = layout
  let y = top
  layout.write(column.title, { font: 'sans', size: 8.5, color: palette.muted }, { x, y, width })
  y += 18
  const most = Math.max(1, ...column.rows.map((row) => row.count))
  for (const row of column.rows) {
    layout.write(row.label, { font: 'sans', size: 10 }, { x, y, width: width - 70, single: true })
    layout.write(
      row.countLabel,
      { font: 'sans', size: 8.5, color: palette.muted },
      { x: x + width - 90, y: y + 1.2, width: 90, align: 'right', single: true },
    )
    const barTop = y + 15
    doc.roundedRect(x, barTop, width, 3, 1).fill(palette.track)
    doc.save()
    doc
      .roundedRect(x, barTop, Math.max(3, (row.count / most) * width), 3, 1)
      .fillOpacity(0.75)
      .fill(palette.emphasis)
    doc.restore()
    y += tagRowHeight
  }
  return y
}

function drawFrequent(layout: Layout, model: ReportModel): void {
  const { frequent } = model
  const rows = Math.max(...frequent.columns.map((column) => column.rows.length))
  sectionTitle(layout, frequent.title, frequent.empty === null ? 20 + rows * tagRowHeight : 20)
  if (frequent.empty !== null) {
    quiet(layout, frequent.empty)
    layout.y += sectionGap
    return
  }
  const width = (layout.width - columnGap) / 2
  const top = layout.y + 2
  const bottoms = frequent.columns.map((column, index) =>
    drawTagColumn(layout, column, layout.left + index * (width + columnGap), top, width),
  )
  layout.y = Math.max(...bottoms) + sectionGap - 12
}

function drawScreening(
  layout: Layout,
  row: ScreeningRow,
  x: number,
  top: number,
  width: number,
): number {
  const { doc } = layout
  let y = top
  layout.write(
    `${row.name} · ${row.topic}`,
    { font: 'sans', size: 8.5, color: palette.muted },
    { x, y, width, single: true },
  )
  y += 16
  layout.write(
    row.score,
    { font: 'display', size: 21, tracking: -0.3 },
    { x, y, width, single: true },
  )
  y += 30
  layout.write(row.severity, { font: 'sansMedium', size: 10 }, { x, y, width, single: true })
  y += 18
  const gap = 2
  const usable = width - gap * (row.bands.length - 1)
  let bandX = x
  for (const band of row.bands) {
    const bandWidth = usable * band.share
    doc.rect(bandX, y, bandWidth, 4).fill(band.active ? palette.emphasis : palette.track)
    bandX += bandWidth + gap
  }
  y += 12
  layout.write(
    row.date,
    { font: 'sans', size: 8, color: palette.muted },
    { x, y, width, single: true },
  )
  return y + 12
}

function drawScreenings(layout: Layout, model: ReportModel): void {
  const { screenings } = model
  sectionTitle(layout, screenings.title, 120)
  if (screenings.empty !== null) {
    quiet(layout, screenings.empty)
    layout.y += sectionGap
    return
  }
  const width = (layout.width - columnGap) / 2
  const top = layout.y + 2
  const bottoms = screenings.rows.map((row, index) =>
    drawScreening(layout, row, layout.left + index * (width + columnGap), top, width),
  )
  layout.y = Math.max(...bottoms) + 10
  quiet(layout, screenings.note)
  layout.y += sectionGap
}

function drawReadingItem(layout: Layout, item: ReadingItem): void {
  const { doc } = layout
  const indent = 12
  const width = layout.width - indent
  const lead = item.lead === null ? '' : `${item.lead}. `
  const height = layout.measure(`${lead}${item.text}`, itemStyle, width)
  layout.ensure(height + 6)
  const top = layout.y
  layout.write('–', { ...itemStyle, color: palette.muted }, { y: top, single: true })
  const options = { width, lineGap: itemStyle.lineGap }
  doc.fontSize(itemStyle.size).fillColor(palette.ink)
  if (lead !== '') {
    doc.font('sansMedium').text(lead, layout.left + indent, top, { ...options, continued: true })
    doc.font('sans').text(item.text, options)
  } else {
    doc.font('sans').text(item.text, layout.left + indent, top, options)
  }
  layout.y = top + height + 5
}

function drawReading(layout: Layout, reading: ReportReadingModel): void {
  const summaryStyle = { font: 'serif', size: 11.5, lineGap: 3.2 } as const
  sectionTitle(layout, reading.title, 40 + layout.measure(reading.summary, summaryStyle))
  layout.write(reading.notice, { font: 'serifItalic', size: 9.5, color: palette.muted })
  layout.y += 1
  quiet(layout, reading.covers)
  layout.y += 12
  layout.write(reading.summary, summaryStyle)
  if (reading.attention !== null) {
    layout.y += 10
    layout.ensure(30)
    layout.write(reading.attention, {
      font: 'sansMedium',
      size: 9.5,
      color: palette.warn,
      lineGap: 2,
    })
  }
  for (const section of reading.sections) {
    layout.y += 16
    layout.ensure(40)
    layout.write(section.title, { font: 'sansMedium', size: 9.5 })
    layout.y += 6
    for (const item of section.items) {
      drawReadingItem(layout, item)
    }
  }
  layout.y += sectionGap - 5
}

function drawNotes(layout: Layout, notes: NonNullable<ReportModel['notes']>): void {
  const first = notes.entries[0]
  sectionTitle(
    layout,
    notes.title,
    first === undefined ? 20 : 18 + layout.measure(first.text, noteStyle),
  )
  if (notes.empty !== null) {
    quiet(layout, notes.empty)
    return
  }
  for (const entry of notes.entries) {
    layout.ensure(18 + layout.measure(entry.text, noteStyle))
    layout.doc
      .circle(layout.left + 3, layout.y + 5.6, 3)
      .fill(moodColor(entry.level / maxMoodLevel))
    layout.write(
      `${entry.date} · ${entry.mood}`,
      { font: 'sans', size: 8.5, color: palette.muted },
      { x: layout.left + 11, width: layout.width - 11 },
    )
    layout.y += 3
    layout.write(entry.text, noteStyle)
    layout.y += 14
  }
}

function drawRunningHead(layout: Layout, model: ReportModel): number {
  const top = sheet.margin - 20
  layout.write(
    'MyCogniAI',
    { font: 'displayMedium', size: 10.5, tracking: -0.2 },
    { y: top, single: true },
  )
  layout.write(
    `${model.header.name} · ${model.header.scope}`,
    { font: 'sans', size: 8, color: palette.muted },
    { y: top + 2, align: 'right', single: true },
  )
  layout.rule(top + 18)
  return top + 44
}

function drawFooters(layout: Layout, model: ReportModel): void {
  const { doc } = layout
  const range = doc.bufferedPageRange()
  const total = range.count
  for (let index = 0; index < total; index += 1) {
    doc.switchToPage(range.start + index)
    const margins = doc.page.margins
    doc.page.margins = { ...margins, bottom: 0 }
    const top = sheet.height - sheet.bottom + 22
    layout.rule(top)
    const pageWidth = 60
    const textWidth = layout.width - pageWidth - 20
    const disclaimerHeight = layout.write(
      model.footer.disclaimer,
      { font: 'sans', size: 7.5, color: palette.muted, lineGap: 1.5 },
      { y: top + 9, width: textWidth },
    )
    layout.write(
      model.footer.crisis,
      { font: 'sans', size: 7.5, color: palette.ink, lineGap: 1.5 },
      { y: top + 9 + disclaimerHeight + 1.5, width: textWidth },
    )
    layout.write(
      model.footer.page(index + 1, total),
      { font: 'sans', size: 7.5, color: palette.muted },
      {
        x: layout.left + layout.width - pageWidth,
        y: top + 9,
        width: pageWidth,
        align: 'right',
        single: true,
      },
    )
    doc.page.margins = margins
  }
}

export function renderReportPdf(model: ReportModel): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: sheet.margin, bottom: sheet.bottom, left: sheet.margin, right: sheet.margin },
    bufferPages: true,
    font: fontPath('sans'),
    lang: model.language,
    displayTitle: true,
    info: {
      Title: `${model.title} · ${model.header.name}`,
      Author: 'MyCogniAI',
      Subject: `${model.header.scope} · ${model.header.period}`,
      Creator: 'MyCogniAI',
      Producer: 'MyCogniAI',
    },
  })
  registerFonts(doc)
  const chunks: Buffer[] = []
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })
    doc.on('end', () => {
      resolve(Buffer.concat(chunks))
    })
    doc.on('error', reject)
  })
  const layout: Layout = createLayout(doc, () => drawRunningHead(layout, model))

  drawHeader(layout, model)
  drawKpis(layout, model)
  drawChart(layout, model)
  drawFrequent(layout, model)
  drawScreenings(layout, model)
  if (model.reading !== null) {
    drawReading(layout, model.reading)
  }
  if (model.notes !== null) {
    drawNotes(layout, model.notes)
  }
  drawFooters(layout, model)
  doc.end()
  return done
}
