import { fileURLToPath } from 'node:url'

export const palette = {
  paper: '#ffffff',
  ink: '#1e2925',
  muted: '#5b6762',
  rule: '#cfd8cf',
  track: '#e5eae2',
  primary: '#23423a',
  emphasis: '#3f6b5c',
  warn: '#8a5716',
  moodLow: '#3f5874',
  moodMid: '#8a9a94',
  moodHigh: '#3f7458',
} as const

const fontFiles = {
  display: 'Newsreader-Display-Regular.ttf',
  displayMedium: 'Newsreader-Display-Medium.ttf',
  serif: 'Newsreader-Text-Regular.ttf',
  serifItalic: 'Newsreader-Text-Italic.ttf',
  sans: 'SchibstedGrotesk-Regular.ttf',
  sansMedium: 'SchibstedGrotesk-Medium.ttf',
} as const

export type FontName = keyof typeof fontFiles

const fontDirectory = new URL('../../../assets/fonts/', import.meta.url)

export function fontPath(name: FontName): string {
  return fileURLToPath(new URL(fontFiles[name], fontDirectory))
}

export function registerFonts(doc: PDFKit.PDFDocument): void {
  for (const name of Object.keys(fontFiles) as FontName[]) {
    doc.registerFont(name, fontPath(name))
  }
}

export const sheet = {
  width: 595.28,
  height: 841.89,
  margin: 56,
  bottom: 92,
} as const

export interface TextStyle {
  font: FontName
  size: number
  color?: string
  lineGap?: number
  tracking?: number
}

export interface TextBox {
  x?: number
  y?: number
  width?: number
  align?: 'left' | 'right' | 'center'
  single?: boolean
}

export interface Layout {
  readonly doc: PDFKit.PDFDocument
  readonly left: number
  readonly width: number
  y: number
  ensure: (height: number) => void
  measure: (text: string, style: TextStyle, width?: number) => number
  fit: (text: string, style: TextStyle, width: number) => string
  write: (text: string, style: TextStyle, box?: TextBox) => number
  rule: (y: number, color?: string) => void
}

function hexChannels(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

function mix(from: string, to: string, amount: number): string {
  const start = hexChannels(from)
  const end = hexChannels(to)
  return `#${start
    .map((channel, index) =>
      Math.round(channel + ((end[index] ?? channel) - channel) * amount)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`
}

export function moodColor(valence: number): string {
  const value = Math.min(1, Math.max(0, valence))
  return value <= 0.5
    ? mix(palette.moodLow, palette.moodMid, value / 0.5)
    : mix(palette.moodMid, palette.moodHigh, (value - 0.5) / 0.5)
}

export function createLayout(doc: PDFKit.PDFDocument, startPage: () => number): Layout {
  const left = sheet.margin
  const width = sheet.width - sheet.margin * 2
  const limit = sheet.height - sheet.bottom

  function apply(style: TextStyle): void {
    doc
      .font(style.font)
      .fontSize(style.size)
      .fillColor(style.color ?? palette.ink)
  }

  function options(style: TextStyle, box: TextBox, boxWidth: number): PDFKit.Mixins.TextOptions {
    return {
      width: boxWidth,
      align: box.align ?? 'left',
      lineGap: style.lineGap ?? 0,
      characterSpacing: style.tracking ?? 0,
      lineBreak: box.single !== true,
    }
  }

  const layout: Layout = {
    doc,
    left,
    width,
    y: sheet.margin,
    ensure(height) {
      if (layout.y + height > limit) {
        doc.addPage()
        layout.y = startPage()
      }
    },
    measure(text, style, boxWidth = width) {
      apply(style)
      return doc.heightOfString(text, options(style, {}, boxWidth))
    },
    fit(text, style, boxWidth) {
      apply(style)
      const fits = (candidate: string) =>
        doc.widthOfString(candidate, { characterSpacing: style.tracking ?? 0 }) <= boxWidth
      let fitted = text
      while (!fits(fitted) && fitted.length > 1) {
        fitted = `${fitted.slice(0, -2).trimEnd()}…`
      }
      return fitted
    },
    write(text, style, box = {}) {
      const boxWidth = box.width ?? width
      apply(style)
      const height = doc.heightOfString(text, options(style, box, boxWidth))
      doc.text(text, box.x ?? left, box.y ?? layout.y, options(style, box, boxWidth))
      if (box.y === undefined) {
        layout.y += height
      }
      return height
    },
    rule(y, color = palette.rule) {
      doc
        .moveTo(left, y)
        .lineTo(left + width, y)
        .lineWidth(0.5)
        .strokeColor(color)
        .stroke()
    },
  }
  return layout
}
