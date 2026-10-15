import type {
  MoodReportPeriod,
  PatientInsightContent,
  ProfessionalInsightContent,
} from '@mycogni/contracts'
import {
  crisisLinesFor,
  dayKey,
  frequentTags,
  instrumentIds,
  instruments,
  isContextId,
  isEmotionId,
  labelsFor,
  maxMoodLevel,
  maxScoreOf,
  moodDays,
  moodNames,
  patternRules,
  periodSummary,
  severityRanges,
  type InstrumentId,
  type LabelSet,
  type Locale,
  type Severity,
} from '@mycogni/domain'
import { reportMessages, type ReportMessages } from './messages/messages.ts'

export interface ReportCheckIn {
  moodLevel: number
  emotions: readonly string[]
  contexts: readonly string[]
  note: string | null
  recordedAt: Date
}

export interface ReportScreening {
  instrument: InstrumentId
  totalScore: number
  severity: Severity
  completedAt: Date
}

interface ReadingPeriod {
  periodStart: Date
  periodEnd: Date
}

export type ReportReading = ReadingPeriod &
  (
    | { audience: 'patient'; content: PatientInsightContent }
    | { audience: 'professional'; content: ProfessionalInsightContent }
  )

export interface ReportInput {
  locale: Locale
  timeZone: string
  now: Date
  days: MoodReportPeriod
  name: string | null
  checkIns: readonly ReportCheckIn[]
  screenings: readonly ReportScreening[]
  readings: readonly ReportReading[]
  includeNotes: boolean
}

export interface ReportKpi {
  label: string
  value: string
  detail: string
}

export interface ChartPoint {
  average: number | null
  label: string | null
}

export interface TagRow {
  label: string
  count: number
  countLabel: string
}

export interface TagColumn {
  title: string
  rows: TagRow[]
}

export interface ScoreBand {
  share: number
  active: boolean
}

export interface ScreeningRow {
  name: string
  topic: string
  score: string
  severity: string
  date: string
  bands: ScoreBand[]
}

export interface ReadingItem {
  lead: string | null
  text: string
}

export interface ReadingSection {
  title: string
  items: ReadingItem[]
}

export interface ReportReadingModel {
  title: string
  notice: string
  covers: string
  summary: string
  attention: string | null
  sections: ReadingSection[]
}

export interface NoteEntry {
  date: string
  mood: string
  level: number
  text: string
}

export interface ReportModel {
  fileName: string
  language: Locale
  title: string
  header: { name: string; scope: string; period: string; generated: string }
  kpis: ReportKpi[]
  chart: {
    title: string
    caption: string
    scale: { top: string; middle: string; bottom: string }
    points: ChartPoint[]
    empty: string | null
  }
  frequent: { title: string; columns: TagColumn[]; empty: string | null }
  screenings: { title: string; note: string; rows: ScreeningRow[]; empty: string | null }
  reading: ReportReadingModel | null
  notes: { title: string; entries: NoteEntry[]; empty: string | null } | null
  footer: { disclaimer: string; crisis: string; page: (page: number, total: number) => string }
}

const weeklyLabelStep = 7

function dateOfDay(day: string): Date {
  return new Date(`${day}T12:00:00Z`)
}

function nearestMood(labels: LabelSet, average: number): string {
  const index = Math.min(maxMoodLevel, Math.max(0, Math.round(average)))
  return labels.moods[moodNames[index] ?? 'neutral']
}

function tagLabel(labels: LabelSet, tag: string): string {
  if (isEmotionId(tag)) {
    return labels.emotions[tag]
  }
  return isContextId(tag) ? labels.contexts[tag] : tag
}

interface Formatters {
  decimal: (value: number) => string
  signed: (value: number) => string
  dayLabel: (day: string) => string
  dayRange: (first: string, last: string) => string
  longDate: (date: Date) => string
  dateTime: (date: Date) => string
}

function plainSpaces(text: string): string {
  return text.replace(/[\u2009\u202f]/g, ' ')
}

function formattersOf(locale: Locale, timeZone: string, days: MoodReportPeriod): Formatters {
  const decimal = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
  const signed = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: 'exceptZero',
  })
  const dayLabel = new Intl.DateTimeFormat(
    locale,
    days === 7
      ? { weekday: 'short', day: 'numeric', timeZone: 'UTC' }
      : { day: 'numeric', month: 'short', timeZone: 'UTC' },
  )
  const range = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
  const longDate = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone,
  })
  const dateTime = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  })
  return {
    decimal: (value) => decimal.format(value),
    signed: (value) => signed.format(value).replace('-', '−'),
    dayLabel: (day) => plainSpaces(dayLabel.format(dateOfDay(day))),
    dayRange: (first, last) => plainSpaces(range.formatRange(dateOfDay(first), dateOfDay(last))),
    longDate: (date) => plainSpaces(longDate.format(date)),
    dateTime: (date) => plainSpaces(dateTime.format(date)),
  }
}

function kpisOf(
  input: ReportInput,
  messages: ReportMessages,
  labels: LabelSet,
  format: Formatters,
  dayAverages: ReturnType<typeof moodDays>,
  recordCount: number,
): ReportKpi[] {
  const { kpis } = messages
  const summary = periodSummary(dayAverages, input.days)
  const { recent, previous, change } = summary
  return [
    {
      label: kpis.recorded,
      value: kpis.recordedValue(summary.recentDays, input.days),
      detail: kpis.recordedDetail(recordCount),
    },
    {
      label: kpis.average,
      value: recent === null ? '—' : kpis.averageValue(format.decimal(recent)),
      detail: recent === null ? kpis.noAverage : nearestMood(labels, recent),
    },
    {
      label: kpis.change(input.days),
      value:
        change === null || recent === null || previous === null
          ? '—'
          : format.signed(Math.round((recent - previous) * 10) / 10),
      detail:
        change === null || previous === null
          ? kpis.noComparison
          : `${kpis.changes[change]}\n${kpis.previous(format.decimal(previous))}`,
    },
  ]
}

function chartPointsOf(
  days: ReturnType<typeof moodDays>,
  format: Formatters,
  period: MoodReportPeriod,
): ChartPoint[] {
  const last = days.length - 1
  return days.map((day, index) => ({
    average: day.average,
    label: period === 7 || (last - index) % weeklyLabelStep === 0 ? format.dayLabel(day.day) : null,
  }))
}

function screeningRowsOf(
  screenings: readonly ReportScreening[],
  inPeriod: (date: Date) => boolean,
  messages: ReportMessages,
  labels: LabelSet,
  format: Formatters,
): ScreeningRow[] {
  return instrumentIds.flatMap((id) => {
    const latest = screenings
      .filter((screening) => screening.instrument === id && inPeriod(screening.completedAt))
      .sort((first, second) => second.completedAt.getTime() - first.completedAt.getTime())[0]
    if (latest === undefined) {
      return []
    }
    const instrument = instruments[id]
    const total = maxScoreOf(instrument) + 1
    return [
      {
        name: instrument.name,
        topic: labels.instruments[id],
        score: messages.screenings.score(latest.totalScore, maxScoreOf(instrument)),
        severity: labels.severities[latest.severity],
        date: messages.screenings.answeredOn(format.longDate(latest.completedAt)),
        bands: severityRanges(instrument).map((range) => ({
          share: (range.max - range.min + 1) / total,
          active: range.severity === latest.severity,
        })),
      },
    ]
  })
}

function readingOf(
  readings: readonly ReportReading[],
  inPeriod: (date: Date) => boolean,
  messages: ReportMessages,
  format: Formatters,
  timeZone: string,
): ReportReadingModel | null {
  const latest = readings
    .filter((reading) => inPeriod(reading.periodEnd))
    .sort((first, second) => second.periodEnd.getTime() - first.periodEnd.getTime())[0]
  if (latest === undefined) {
    return null
  }
  const { reading } = messages
  const covers = reading.covers(
    format.dayRange(dayKey(latest.periodStart, timeZone), dayKey(latest.periodEnd, timeZone)),
  )
  const plain = (texts: readonly string[]): ReadingItem[] =>
    texts.map((text) => ({ lead: null, text }))
  if (latest.audience === 'patient') {
    const { summary, highlights, suggestions } = latest.content
    return {
      title: reading.patientTitle,
      notice: reading.notice,
      covers,
      summary,
      attention: null,
      sections: [
        { title: reading.highlights, items: plain(highlights) },
        {
          title: reading.suggestions,
          items: suggestions.map((suggestion) => ({
            lead: suggestion.title,
            text: suggestion.detail,
          })),
        },
      ].filter((section) => section.items.length > 0),
    }
  }
  const { summary, trends, themes, attention, attentionReason } = latest.content
  return {
    title: reading.professionalTitle,
    notice: reading.notice,
    covers,
    summary,
    attention:
      attention === 'none'
        ? null
        : [reading.attention[attention], attentionReason].filter(Boolean).join('. '),
    sections: [
      { title: reading.trends, items: plain(trends) },
      { title: reading.themes, items: plain(themes) },
    ].filter((section) => section.items.length > 0),
  }
}

export function buildReportModel(input: ReportInput): ReportModel {
  const { locale, timeZone, now, days } = input
  const messages = reportMessages(locale)
  const labels = labelsFor(locale)
  const format = formattersOf(locale, timeZone, days)
  const dayAverages = moodDays(input.checkIns, { timeZone, today: now, days: days * 2 })
  const current = dayAverages.slice(-days)
  const periodDays = new Set(current.map((day) => day.day))
  const inPeriod = (date: Date) => periodDays.has(dayKey(date, timeZone))
  const checkIns = input.checkIns
    .filter((checkIn) => inPeriod(checkIn.recordedAt))
    .sort((first, second) => first.recordedAt.getTime() - second.recordedAt.getTime())
  const first = current[0]?.day ?? dayKey(now, timeZone)
  const last = current.at(-1)?.day ?? first
  const emotions = frequentTags(
    checkIns.map((checkIn) => checkIn.emotions),
    patternRules.frequentTags,
  )
  const contexts = frequentTags(
    checkIns.map((checkIn) => checkIn.contexts),
    patternRules.frequentTags,
  )
  const tagRows = (tags: typeof emotions): TagRow[] =>
    tags.map((tag) => ({
      label: tagLabel(labels, tag.tag),
      count: tag.count,
      countLabel: messages.frequent.count(tag.count),
    }))
  const screenings = screeningRowsOf(input.screenings, inPeriod, messages, labels, format)
  const notes = checkIns.flatMap((checkIn) =>
    checkIn.note === null
      ? []
      : [
          {
            date: format.dateTime(checkIn.recordedAt),
            mood: nearestMood(labels, checkIn.moodLevel),
            level: checkIn.moodLevel,
            text: checkIn.note,
          },
        ],
  )

  return {
    fileName: messages.fileName(dayKey(now, timeZone)),
    language: locale,
    title: messages.title,
    header: {
      name: input.name ?? messages.unnamed,
      scope: messages.lastDays(days),
      period: format.dayRange(first, last),
      generated: messages.generatedOn(format.longDate(now)),
    },
    kpis: kpisOf(input, messages, labels, format, dayAverages, checkIns.length),
    chart: {
      title: messages.chart.title,
      caption: messages.chart.caption,
      scale: {
        top: labels.moods.veryGood,
        middle: labels.moods.neutral,
        bottom: labels.moods.veryBad,
      },
      points: chartPointsOf(current, format, days),
      empty: checkIns.length === 0 ? messages.chart.empty : null,
    },
    frequent: {
      title: messages.frequent.title,
      columns: [
        { title: messages.frequent.emotions, rows: tagRows(emotions) },
        { title: messages.frequent.contexts, rows: tagRows(contexts) },
      ],
      empty: emotions.length === 0 && contexts.length === 0 ? messages.frequent.empty : null,
    },
    screenings: {
      title: messages.screenings.title,
      note: messages.screenings.note,
      rows: screenings,
      empty: screenings.length === 0 ? messages.screenings.empty : null,
    },
    reading: readingOf(input.readings, inPeriod, messages, format, timeZone),
    notes: input.includeNotes
      ? {
          title: messages.notes.title,
          entries: notes,
          empty: notes.length === 0 ? messages.notes.empty : null,
        }
      : null,
    footer: {
      disclaimer: messages.footer.disclaimer,
      crisis: `${messages.footer.crisis} ${crisisLinesFor(locale)
        .map((line) => `${line.display} (${line.description})`)
        .join(' · ')}`,
      page: messages.footer.page,
    },
  }
}
