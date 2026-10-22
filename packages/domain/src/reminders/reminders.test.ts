import { describe, expect, it } from '@jest/globals'
import {
  dueReminderDay,
  isReminderTime,
  isWeekDay,
  localDayOf,
  minutesOf,
  reminderDefaults,
  scheduledAt,
  type ReminderSchedule,
} from './reminders.ts'

const everyDay: ReminderSchedule = {
  enabled: true,
  time: '20:00',
  days: [0, 1, 2, 3, 4, 5, 6],
  push: false,
  email: true,
  lastSentOn: null,
}

describe('reminder times', () => {
  it('accepts a 24-hour HH:mm time', () => {
    expect(['00:00', '07:05', '23:59'].every(isReminderTime)).toBe(true)
    expect(['24:00', '7:05', '07:60', '0700', ''].some(isReminderTime)).toBe(false)
    expect(minutesOf('07:05')).toBe(425)
    expect(() => minutesOf('7h')).toThrow(RangeError)
  })

  it('knows the days of the week, Sunday first', () => {
    expect(isWeekDay(0)).toBe(true)
    expect(isWeekDay(7)).toBe(false)
    expect(reminderDefaults.days).toEqual([0, 1, 2, 3, 4, 5, 6])
  })
})

describe('local day', () => {
  it('follows the person time zone, not UTC', () => {
    const lateNight = new Date('2026-10-23T02:30:00Z')
    expect(localDayOf(lateNight, 'America/Sao_Paulo')).toEqual({ day: '2026-10-22', weekday: 4 })
    expect(localDayOf(lateNight, 'Europe/Lisbon')).toEqual({ day: '2026-10-23', weekday: 5 })
  })

  it('places the reminder time in the right instant', () => {
    expect(scheduledAt('2026-10-22', '20:00', 'America/Sao_Paulo').toISOString()).toBe(
      '2026-10-22T23:00:00.000Z',
    )
    expect(scheduledAt('2026-07-01', '08:30', 'Europe/Lisbon').toISOString()).toBe(
      '2026-07-01T07:30:00.000Z',
    )
    expect(() => scheduledAt('22/10/2026', '20:00', 'Europe/Lisbon')).toThrow(RangeError)
  })

  it('moves a time skipped by the spring change to after the jump', () => {
    expect(scheduledAt('2026-03-29', '01:30', 'Europe/Lisbon').toISOString()).toBe(
      '2026-03-29T01:30:00.000Z',
    )
    expect(scheduledAt('2026-03-29', '09:00', 'Europe/Lisbon').toISOString()).toBe(
      '2026-03-29T08:00:00.000Z',
    )
  })

  it('picks one moment when the autumn change repeats an hour', () => {
    expect(scheduledAt('2026-10-25', '01:30', 'Europe/Lisbon').toISOString()).toBe(
      '2026-10-25T01:30:00.000Z',
    )
    expect(scheduledAt('2026-10-25', '09:00', 'Europe/Lisbon').toISOString()).toBe(
      '2026-10-25T09:00:00.000Z',
    )
  })
})

describe('due reminders', () => {
  const zone = 'America/Sao_Paulo'

  it('is due in the window after the chosen time and stamps the local day', () => {
    expect(dueReminderDay(everyDay, new Date('2026-10-22T23:00:00Z'), zone)).toBe('2026-10-22')
    expect(dueReminderDay(everyDay, new Date('2026-10-22T23:14:59Z'), zone)).toBe('2026-10-22')
  })

  it('is not due before the time or once the window has passed', () => {
    expect(dueReminderDay(everyDay, new Date('2026-10-22T22:59:00Z'), zone)).toBeNull()
    expect(dueReminderDay(everyDay, new Date('2026-10-22T23:15:00Z'), zone)).toBeNull()
  })

  it('sends at most once a day', () => {
    expect(
      dueReminderDay(
        { ...everyDay, lastSentOn: '2026-10-22' },
        new Date('2026-10-22T23:05:00Z'),
        zone,
      ),
    ).toBeNull()
    expect(
      dueReminderDay(
        { ...everyDay, lastSentOn: '2026-10-21' },
        new Date('2026-10-22T23:05:00Z'),
        zone,
      ),
    ).toBe('2026-10-22')
  })

  it('respects the chosen days of the week', () => {
    const weekdays = { ...everyDay, days: [1, 2, 3, 4, 5] }
    expect(dueReminderDay(weekdays, new Date('2026-10-22T23:05:00Z'), zone)).toBe('2026-10-22')
    expect(dueReminderDay(weekdays, new Date('2026-10-24T23:05:00Z'), zone)).toBeNull()
  })

  it('stays quiet when reminders or every channel are off', () => {
    const now = new Date('2026-10-22T23:05:00Z')
    expect(dueReminderDay({ ...everyDay, enabled: false }, now, zone)).toBeNull()
    expect(dueReminderDay({ ...everyDay, email: false }, now, zone)).toBeNull()
    expect(dueReminderDay({ ...everyDay, email: false, push: true }, now, zone)).toBe('2026-10-22')
  })

  it('uses the local day of a late reminder across midnight in UTC', () => {
    const late = { ...everyDay, time: '23:30' }
    expect(dueReminderDay(late, new Date('2026-10-23T02:35:00Z'), zone)).toBe('2026-10-22')
  })

  it('still sends once on the day the clocks spring forward', () => {
    const night = { ...everyDay, time: '01:30' }
    expect(dueReminderDay(night, new Date('2026-03-29T01:35:00Z'), 'Europe/Lisbon')).toBe(
      '2026-03-29',
    )
  })
})
