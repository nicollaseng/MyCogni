import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { eq } from 'drizzle-orm'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { notifications, pushSubscriptions, reminderSettings } from '../../src/db/schema/index.ts'
import type { Email, Mailer } from '../../src/mail/mailer.ts'
import { createReminderJob, type ReminderJob } from '../../src/modules/reminders/reminder-job.ts'
import { createReminderStore } from '../../src/modules/reminders/reminder-store.ts'
import { createUnsubscribeTokens } from '../../src/modules/reminders/unsubscribe-token.ts'
import type {
  PushMessage,
  PushOutcome,
  PushSender,
  PushTarget,
} from '../../src/push/push-sender.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { createTestUser, deleteTestUser, type TestUser } from '../support/supabase.ts'

const eveningInSaoPaulo = new Date('2030-01-15T23:02:00Z')

const tokens = createUnsubscribeTokens('sb_secret_test')

class FakePush implements PushSender {
  readonly sent: { target: PushTarget; message: PushMessage }[] = []

  send(target: PushTarget, message: PushMessage): Promise<PushOutcome> {
    this.sent.push({ target, message })
    return Promise.resolve(target.endpoint.endsWith('/gone') ? 'gone' : 'sent')
  }
}

class FakeMailer implements Mailer {
  readonly sent: Email[] = []

  send(email: Email): Promise<boolean> {
    this.sent.push(email)
    return Promise.resolve(true)
  }
}

describe('practice reminder job', () => {
  let connection: DatabaseConnection
  let marina: TestUser
  let caio: TestUser
  let push: FakePush
  let mailer: FakeMailer
  let job: ReminderJob

  function jobAt(moment: Date, sender: PushSender | null): ReminderJob {
    return createReminderJob({
      store: createReminderStore(connection.db),
      push: sender,
      mailer,
      tokens,
      webUrl: 'https://app.exemplo.com',
      now: () => moment,
    })
  }

  function mineOnly<T>(items: readonly T[], match: (item: T) => boolean): T[] {
    return items.filter(match)
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    marina = await createTestUser({ locale: 'pt-BR' })
    caio = await createTestUser({ locale: 'en-US' })
    await connection.db.insert(reminderSettings).values([
      { userId: marina.id, enabled: true, time: '20:00', push: true, email: true },
      {
        userId: caio.id,
        enabled: true,
        time: '20:00',
        days: [1, 2, 3, 4, 5],
        push: false,
        email: true,
      },
    ])
    await connection.db.insert(pushSubscriptions).values([
      {
        userId: marina.id,
        endpoint: `https://push.example.com/${marina.id}/phone`,
        p256dh: 'k',
        auth: 'a',
      },
      {
        userId: marina.id,
        endpoint: `https://push.example.com/${marina.id}/gone`,
        p256dh: 'k',
        auth: 'a',
      },
    ])
    push = new FakePush()
    mailer = new FakeMailer()
    job = jobAt(eveningInSaoPaulo, push)
  })

  afterAll(async () => {
    await deleteTestUser(marina.id)
    await deleteTestUser(caio.id)
    await connection.close()
  })

  it('reminds people whose time just came, by push, email and the bell', async () => {
    await job.run()

    const pushes = mineOnly(push.sent, ({ target }) => target.endpoint.includes(marina.id))
    expect(pushes.map(({ message }) => message)).toEqual([
      { title: 'Hora da sua pausa', body: 'Que tal alguns minutos para você?', url: '/zen' },
      { title: 'Hora da sua pausa', body: 'Que tal alguns minutos para você?', url: '/zen' },
    ])
    const [email] = mineOnly(mailer.sent, (sent) => sent.to === marina.email)
    expect(email?.subject).toBe('Hora da sua pausa')
    const link = /email-off\?token=([^"&\s]+)/.exec(email?.text ?? '')?.[1] ?? ''
    expect(tokens.verify(decodeURIComponent(link))).toBe(marina.id)
    const [settings] = await connection.db
      .select({ lastSentOn: reminderSettings.lastSentOn })
      .from(reminderSettings)
      .where(eq(reminderSettings.userId, marina.id))
    expect(settings?.lastSentOn).toBe('2030-01-15')
    const bell = await connection.db
      .select({ kind: notifications.kind })
      .from(notifications)
      .where(eq(notifications.userId, marina.id))
    expect(bell).toEqual([{ kind: 'reminder' }])
  })

  it('forgets a device the push service says is gone', async () => {
    const devices = await connection.db
      .select({ endpoint: pushSubscriptions.endpoint, lastUsedAt: pushSubscriptions.lastUsedAt })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, marina.id))

    expect(devices).toEqual([
      { endpoint: `https://push.example.com/${marina.id}/phone`, lastUsedAt: expect.any(Date) },
    ])
  })

  it('sends at most once a day, even when the job runs again', async () => {
    const before = mailer.sent.length
    await job.run()
    await jobAt(new Date('2030-01-15T23:09:00Z'), push).run()

    expect(mineOnly(mailer.sent.slice(before), (sent) => sent.to === marina.email)).toEqual([])
  })

  it('respects the days chosen and the channels turned on', async () => {
    expect(mineOnly(mailer.sent, (sent) => sent.to === caio.email)).toHaveLength(1)
    expect(mineOnly(push.sent, ({ target }) => target.endpoint.includes(caio.id))).toEqual([])
    const saturday = new Date('2030-01-19T23:02:00Z')
    await jobAt(saturday, push).run()

    expect(mineOnly(mailer.sent, (sent) => sent.to === caio.email)).toHaveLength(1)
    await connection.db
      .update(reminderSettings)
      .set({ email: false })
      .where(eq(reminderSettings.userId, caio.id))
    await jobAt(new Date('2030-01-21T23:02:00Z'), push).run()
    expect(mineOnly(mailer.sent, (sent) => sent.to === caio.email)).toHaveLength(1)
  })

  it('still emails when web push is not configured', async () => {
    await connection.db
      .update(reminderSettings)
      .set({ lastSentOn: null })
      .where(eq(reminderSettings.userId, marina.id))
    const pushesBefore = push.sent.length
    const emailsBefore = mineOnly(mailer.sent, (sent) => sent.to === marina.email).length
    await jobAt(eveningInSaoPaulo, null).run()

    expect(push.sent.length).toBe(pushesBefore)
    expect(mineOnly(mailer.sent, (sent) => sent.to === marina.email)).toHaveLength(emailsBefore + 1)
  })
})
