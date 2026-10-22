import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import type { AccountExport, ReminderOverview } from '@mycogni/contracts'
import { eq } from 'drizzle-orm'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { withUser } from '../../src/db/rls.ts'
import { pushSubscriptions, reminderSettings } from '../../src/db/schema/index.ts'
import { createUnsubscribeTokens } from '../../src/modules/reminders/unsubscribe-token.ts'
import type { App } from '../../src/shared/http.ts'
import { registerProfessional } from '../support/care.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { bearer, createTestUser, deleteTestUser, type TestUser } from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier, testConfig } from '../support/test-app.ts'

const settings = { enabled: true, time: '07:30', days: [5, 1, 1, 3], push: true, email: true }

function device(name: string) {
  return {
    endpoint: `https://push.example.com/send/${name}`,
    keys: { p256dh: `key-${name}`, auth: `auth-${name}` },
  }
}

describe('/v1/reminders', () => {
  let app: App
  let connection: DatabaseConnection
  let ana: TestUser
  let bruno: TestUser
  let helena: TestUser

  function call(
    method: 'GET' | 'PUT' | 'POST' | 'DELETE',
    url: string,
    user: TestUser | null,
    payload?: object,
  ) {
    return app.inject({
      method,
      url,
      headers: user === null ? {} : bearer(user),
      ...(payload === undefined ? {} : { payload }),
    })
  }

  async function overview(user: TestUser): Promise<ReminderOverview> {
    const response = await call('GET', '/v1/reminders', user)
    expect(response.statusCode).toBe(200)
    return response.json<ReminderOverview>()
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({
      db: connection.db,
      verifier: supabaseVerifier(),
      config: {
        ...testConfig,
        push: { publicKey: 'BPublicKey', privateKey: 'private', subject: 'mailto:a@b.co' },
      },
    })
    await app.ready()
    ana = await createTestUser()
    bruno = await createTestUser()
    helena = await createTestUser()
    await registerProfessional(connection.db, helena.id)
  })

  afterAll(async () => {
    await deleteTestUser(ana.id)
    await deleteTestUser(bruno.id)
    await deleteTestUser(helena.id)
    await app.close()
    await connection.close()
  })

  it('starts off with gentle defaults and the push key', async () => {
    expect(await overview(ana)).toEqual({
      settings: {
        enabled: false,
        time: '20:00',
        days: [0, 1, 2, 3, 4, 5, 6],
        push: false,
        email: true,
      },
      pushKey: 'BPublicKey',
      devices: 0,
    })
  })

  it('saves a time and the days, tidied', async () => {
    const response = await call('PUT', '/v1/reminders', ana, settings)

    expect(response.statusCode).toBe(200)
    expect(response.json<ReminderOverview>().settings).toEqual({ ...settings, days: [1, 3, 5] })
    const changed = await call('PUT', '/v1/reminders', ana, { ...settings, time: '21:15' })
    expect(changed.json<ReminderOverview>().settings.time).toBe('21:15')
  })

  it('refuses times and days that do not exist', async () => {
    for (const wrong of [
      { ...settings, time: '24:00' },
      { ...settings, time: '7:30' },
      { ...settings, days: [] },
      { ...settings, days: [7] },
    ]) {
      expect((await call('PUT', '/v1/reminders', ana, wrong)).statusCode).toBe(400)
    }
  })

  it('is only for patients and keeps each person to their own settings', async () => {
    expect((await call('GET', '/v1/reminders', helena)).statusCode).toBe(403)
    expect((await overview(bruno)).settings.enabled).toBe(false)
    const seen = await withUser(connection.db, bruno.id, (tx) =>
      tx.select({ userId: reminderSettings.userId }).from(reminderSettings),
    )
    expect(seen).toEqual([])
  })

  it('keeps one owner per device and lets the person remove it', async () => {
    expect((await call('POST', '/v1/push/subscriptions', ana, device('phone'))).statusCode).toBe(
      204,
    )
    expect((await call('POST', '/v1/push/subscriptions', ana, device('laptop'))).statusCode).toBe(
      204,
    )
    expect((await overview(ana)).devices).toBe(2)

    await call('POST', '/v1/push/subscriptions', bruno, device('phone'))
    expect((await overview(ana)).devices).toBe(1)
    expect((await overview(bruno)).devices).toBe(1)
    const seenByAna = await withUser(connection.db, ana.id, (tx) =>
      tx.select({ endpoint: pushSubscriptions.endpoint }).from(pushSubscriptions),
    )
    expect(seenByAna).toEqual([{ endpoint: device('laptop').endpoint }])

    expect(
      (await call('DELETE', '/v1/push/subscriptions', ana, { endpoint: device('phone').endpoint }))
        .statusCode,
    ).toBe(204)
    expect((await overview(bruno)).devices).toBe(1)
    await call('DELETE', '/v1/push/subscriptions', ana, { endpoint: device('laptop').endpoint })
    expect((await overview(ana)).devices).toBe(0)
  })

  it('refuses devices that are not https and professionals', async () => {
    expect(
      (
        await call('POST', '/v1/push/subscriptions', ana, {
          ...device('x'),
          endpoint: 'http://push.example.com/x',
        })
      ).statusCode,
    ).toBe(400)
    expect((await call('POST', '/v1/push/subscriptions', helena, device('pro'))).statusCode).toBe(
      403,
    )
    await expect(
      withUser(connection.db, helena.id, (tx) =>
        tx.execute(
          `select public.claim_push_subscription('https://push.example.com/send/pro', 'k', 'a')`,
        ),
      ),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
  })

  it('turns email reminders off from a signed link, without a session', async () => {
    const token = createUnsubscribeTokens(testConfig.supabaseSecretKey).sign(ana.id)

    expect((await call('POST', '/v1/public/reminders/email-off', null, { token })).statusCode).toBe(
      204,
    )
    expect((await overview(ana)).settings).toEqual(
      expect.objectContaining({ enabled: true, email: false, push: true }),
    )
    const forged = `${bruno.id}.${token.split('.')[1] ?? ''}`
    expect(
      (await call('POST', '/v1/public/reminders/email-off', null, { token: forged })).statusCode,
    ).toBe(422)
    expect(
      (await call('POST', '/v1/public/reminders/email-off', null, { token: 'x' })).statusCode,
    ).toBe(400)
  })

  it('exports the reminders and removes them with the account', async () => {
    await call('POST', '/v1/push/subscriptions', ana, device('tablet'))
    const exported = (await call('GET', '/v1/me/export', ana)).json<AccountExport>()

    expect(exported.reminders).toEqual({
      settings: expect.objectContaining({ time: '21:15', days: [1, 3, 5] }),
      devices: [{ createdAt: expect.any(String) }],
    })

    await deleteTestUser(ana.id)
    expect(
      await connection.db
        .select()
        .from(reminderSettings)
        .where(eq(reminderSettings.userId, ana.id)),
    ).toEqual([])
    expect(
      await connection.db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, ana.id)),
    ).toEqual([])
    ana = await createTestUser()
  })
})
