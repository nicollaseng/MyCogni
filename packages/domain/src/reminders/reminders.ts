export const reminderChannels = ['push', 'email'] as const

export type ReminderChannel = (typeof reminderChannels)[number]

export const weekDays = [0, 1, 2, 3, 4, 5, 6] as const

export type WeekDay = (typeof weekDays)[number]

export const reminderWindowMinutes = 15

export const reminderDefaults = {
  enabled: false,
  time: '20:00',
  days: [...weekDays],
  push: false,
  email: true,
} as const

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/

const minuteInMilliseconds = 60_000

export function isReminderTime(value: string): boolean {
  return timePattern.test(value)
}

export function isWeekDay(value: number): value is WeekDay {
  return (weekDays as readonly number[]).includes(value)
}

export function minutesOf(time: string): number {
  const match = timePattern.exec(time)
  if (match === null) {
    throw new RangeError(`Not a reminder time: ${time}`)
  }
  return Number(match[1]) * 60 + Number(match[2])
}

interface WallClock {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

function wallClockOf(instant: Date, timeZone: string): WallClock {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).formatToParts(instant)
  const values: Record<string, string> = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  )
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
  }
}

function offsetMinutes(instant: number, timeZone: string): number {
  const clock = wallClockOf(new Date(instant), timeZone)
  const asUtc = Date.UTC(clock.year, clock.month - 1, clock.day, clock.hour, clock.minute)
  return Math.round(
    (asUtc - Math.floor(instant / minuteInMilliseconds) * minuteInMilliseconds) /
      minuteInMilliseconds,
  )
}

export interface LocalDay {
  day: string
  weekday: number
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function localDayOf(instant: Date, timeZone: string): LocalDay {
  const { year, month, day } = wallClockOf(instant, timeZone)
  return {
    day: `${String(year)}-${pad(month)}-${pad(day)}`,
    weekday: new Date(Date.UTC(year, month - 1, day)).getUTCDay(),
  }
}

const dayPattern = /^(\d{4})-(\d{2})-(\d{2})$/

export function scheduledAt(day: string, time: string, timeZone: string): Date {
  const match = dayPattern.exec(day)
  if (match === null) {
    throw new RangeError(`Not a day: ${day}`)
  }
  const wall =
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) +
    minutesOf(time) * minuteInMilliseconds
  const first = wall - offsetMinutes(wall, timeZone) * minuteInMilliseconds
  const second = wall - offsetMinutes(first, timeZone) * minuteInMilliseconds
  return new Date(Math.max(first, second))
}

export interface ReminderSchedule {
  enabled: boolean
  time: string
  days: readonly number[]
  push: boolean
  email: boolean
  lastSentOn: string | null
}

export function dueReminderDay(
  schedule: ReminderSchedule,
  now: Date,
  timeZone: string,
): string | null {
  if (!schedule.enabled || (!schedule.push && !schedule.email)) {
    return null
  }
  const { day, weekday } = localDayOf(now, timeZone)
  if (!schedule.days.includes(weekday) || schedule.lastSentOn === day) {
    return null
  }
  const late = now.getTime() - scheduledAt(day, schedule.time, timeZone).getTime()
  return late >= 0 && late < reminderWindowMinutes * minuteInMilliseconds ? day : null
}
