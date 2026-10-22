import type { ReminderSchedule } from '@mycogni/domain'
import { and, eq, isNull, ne, or, sql } from 'drizzle-orm'
import { authUsers } from 'drizzle-orm/supabase'
import type { Database } from '../../db/client.ts'
import {
  notifications,
  profiles,
  pushSubscriptions,
  reminderSettings,
} from '../../db/schema/index.ts'
import type { PushTarget } from '../../push/push-sender.ts'

export interface ReminderCandidate {
  userId: string
  email: string | null
  locale: string | null
  timezone: string
  schedule: ReminderSchedule
}

export interface ReminderDevice extends PushTarget {
  id: string
}

export interface ReminderStore {
  candidates(): Promise<ReminderCandidate[]>
  claim(userId: string, day: string): Promise<boolean>
  devices(userId: string): Promise<ReminderDevice[]>
  forget(deviceId: string): Promise<void>
  used(deviceId: string): Promise<void>
  notify(userId: string): Promise<void>
}

export function createReminderStore(db: Database): ReminderStore {
  return {
    async candidates() {
      const rows = await db
        .select({
          userId: reminderSettings.userId,
          email: authUsers.email,
          locale: profiles.locale,
          timezone: profiles.timezone,
          enabled: reminderSettings.enabled,
          time: reminderSettings.time,
          days: reminderSettings.days,
          push: reminderSettings.push,
          emailEnabled: reminderSettings.email,
          lastSentOn: reminderSettings.lastSentOn,
        })
        .from(reminderSettings)
        .innerJoin(profiles, eq(profiles.id, reminderSettings.userId))
        .innerJoin(authUsers, eq(authUsers.id, reminderSettings.userId))
        .where(
          and(
            eq(reminderSettings.enabled, true),
            eq(profiles.accountType, 'patient'),
            or(eq(reminderSettings.push, true), eq(reminderSettings.email, true)),
          ),
        )
      return rows.map((row) => ({
        userId: row.userId,
        email: row.email,
        locale: row.locale,
        timezone: row.timezone,
        schedule: {
          enabled: row.enabled,
          time: row.time,
          days: row.days,
          push: row.push,
          email: row.emailEnabled,
          lastSentOn: row.lastSentOn,
        },
      }))
    },
    async claim(userId, day) {
      const rows = await db
        .update(reminderSettings)
        .set({ lastSentOn: day })
        .where(
          and(
            eq(reminderSettings.userId, userId),
            or(isNull(reminderSettings.lastSentOn), ne(reminderSettings.lastSentOn, day)),
          ),
        )
        .returning({ userId: reminderSettings.userId })
      return rows.length > 0
    },
    devices(userId) {
      return db
        .select({
          id: pushSubscriptions.id,
          endpoint: pushSubscriptions.endpoint,
          p256dh: pushSubscriptions.p256dh,
          auth: pushSubscriptions.auth,
        })
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, userId))
    },
    async forget(deviceId) {
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, deviceId))
    },
    async used(deviceId) {
      await db
        .update(pushSubscriptions)
        .set({ lastUsedAt: sql`now()` })
        .where(eq(pushSubscriptions.id, deviceId))
    },
    async notify(userId) {
      await db.insert(notifications).values({ userId, kind: 'reminder' })
    },
  }
}
