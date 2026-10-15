import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import type { NotificationList } from '@mycogni/contracts'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { insights, notifications } from '../../src/db/schema/index.ts'
import type { App } from '../../src/shared/http.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { bearer, createTestUser, deleteTestUser, type TestUser } from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier } from '../support/test-app.ts'

describe('notifications', () => {
  let app: App
  let connection: DatabaseConnection
  let ana: TestUser
  let bruno: TestUser

  async function bell(user: TestUser): Promise<NotificationList> {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/notifications',
      headers: bearer(user),
    })
    expect(response.statusCode).toBe(200)
    return response.json<NotificationList>()
  }

  async function seedInsightNotification(userId: string): Promise<{ insightId: string }> {
    const [insight] = await connection.db
      .insert(insights)
      .values({
        patientId: userId,
        audience: 'patient',
        periodStart: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        periodEnd: new Date(),
        checkInCount: 7,
        content: { summary: 'Semana estável.', highlights: [], suggestions: [] },
        model: 'test-model',
      })
      .returning({ id: insights.id })
    if (insight === undefined) {
      throw new Error('Insight was not seeded')
    }
    await connection.db
      .insert(notifications)
      .values({ userId, kind: 'insight', insightId: insight.id })
    return { insightId: insight.id }
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    ana = await createTestUser()
    bruno = await createTestUser()
  })

  afterAll(async () => {
    await deleteTestUser(ana.id)
    await deleteTestUser(bruno.id)
    await app.close()
    await connection.close()
  })

  it('tells which weekly summary an insight notification points to', async () => {
    const { insightId } = await seedInsightNotification(ana.id)
    await connection.db.insert(notifications).values({ userId: ana.id, kind: 'system' })

    const { items, unread } = await bell(ana)

    expect(unread).toBe(2)
    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'insight', insightId, invitation: null, readAt: null }),
        expect.objectContaining({ kind: 'system', insightId: null, invitation: null }),
      ]),
    )
  })

  it('marks a single notification as read and keeps the others unread', async () => {
    const before = await bell(ana)
    const insight = before.items.find((item) => item.kind === 'insight')
    if (insight === undefined) {
      throw new Error('The insight notification is missing')
    }

    const response = await app.inject({
      method: 'POST',
      url: '/v1/notifications/read',
      headers: bearer(ana),
      payload: { ids: [insight.id] },
    })

    expect(response.statusCode).toBe(204)
    const after = await bell(ana)
    expect(after.unread).toBe(before.unread - 1)
    expect(after.items.find((item) => item.id === insight.id)?.readAt).not.toBeNull()
    expect(after.items.find((item) => item.kind === 'system')?.readAt).toBeNull()
  })

  it('does not let another person read or mark those notifications', async () => {
    const { items } = await bell(ana)
    const system = items.find((item) => item.kind === 'system')
    if (system === undefined) {
      throw new Error('The system notification is missing')
    }

    const response = await app.inject({
      method: 'POST',
      url: '/v1/notifications/read',
      headers: bearer(bruno),
      payload: { ids: [system.id] },
    })

    expect(response.statusCode).toBe(204)
    expect((await bell(bruno)).items).toEqual([])
    expect((await bell(ana)).items.find((item) => item.id === system.id)?.readAt).toBeNull()
  })
})
