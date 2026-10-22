import type { PushSubscriptionInput, ReminderSettings } from '@mycogni/contracts'
import { and, asc, count, eq, sql } from 'drizzle-orm'
import type { Database, Transaction } from '../../db/client.ts'
import { withUser } from '../../db/rls.ts'
import { pushSubscriptions, reminderSettings } from '../../db/schema/index.ts'

export interface ReminderExport {
  settings: ReminderSettings | null
  devices: { createdAt: Date }[]
}

export interface ReminderRepository {
  settings(userId: string): Promise<ReminderSettings | null>
  save(userId: string, settings: ReminderSettings): Promise<ReminderSettings>
  devices(userId: string): Promise<number>
  claimDevice(userId: string, input: PushSubscriptionInput): Promise<void>
  removeDevice(userId: string, endpoint: string): Promise<void>
  turnEmailOff(userId: string): Promise<boolean>
}

const settingsColumns = {
  enabled: reminderSettings.enabled,
  time: reminderSettings.time,
  days: reminderSettings.days,
  push: reminderSettings.push,
  email: reminderSettings.email,
}

async function settingsOf(tx: Transaction, userId: string): Promise<ReminderSettings | null> {
  const [row] = await tx
    .select(settingsColumns)
    .from(reminderSettings)
    .where(eq(reminderSettings.userId, userId))
  return row ?? null
}

export async function reminderExportOf(tx: Transaction, userId: string): Promise<ReminderExport> {
  return {
    settings: await settingsOf(tx, userId),
    devices: await tx
      .select({ createdAt: pushSubscriptions.createdAt })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId))
      .orderBy(asc(pushSubscriptions.createdAt)),
  }
}

export function createReminderRepository(db: Database): ReminderRepository {
  return {
    settings(userId) {
      return withUser(db, userId, (tx) => settingsOf(tx, userId))
    },
    save(userId, settings) {
      return withUser(db, userId, async (tx) => {
        const [row] = await tx
          .insert(reminderSettings)
          .values({ userId, ...settings })
          .onConflictDoUpdate({
            target: reminderSettings.userId,
            set: { ...settings, updatedAt: sql`now()` },
          })
          .returning(settingsColumns)
        if (row === undefined) {
          throw new Error('The reminder settings were not stored')
        }
        return row
      })
    },
    devices(userId) {
      return withUser(db, userId, async (tx) => {
        const [row] = await tx
          .select({ total: count() })
          .from(pushSubscriptions)
          .where(eq(pushSubscriptions.userId, userId))
        return row?.total ?? 0
      })
    },
    claimDevice(userId, { endpoint, keys }) {
      return withUser(db, userId, async (tx) => {
        await tx.execute(
          sql`select public.claim_push_subscription(${endpoint}, ${keys.p256dh}, ${keys.auth})`,
        )
      })
    },
    removeDevice(userId, endpoint) {
      return withUser(db, userId, async (tx) => {
        await tx
          .delete(pushSubscriptions)
          .where(
            and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)),
          )
      })
    },
    turnEmailOff(userId) {
      return withUser(db, userId, async (tx) => {
        const rows = await tx
          .update(reminderSettings)
          .set({ email: false })
          .where(eq(reminderSettings.userId, userId))
          .returning({ userId: reminderSettings.userId })
        return rows.length > 0
      })
    },
  }
}
