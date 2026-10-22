import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import type { DataExport, DataExportDownload, LatestDataExport } from '@mycogni/contracts'
import { Queue } from 'bullmq'
import { eq } from 'drizzle-orm'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { withUser } from '../../src/db/rls.ts'
import { dataExports } from '../../src/db/schema/index.ts'
import { createRedis, dataExportQueueName } from '../../src/jobs/redis.ts'
import type { App } from '../../src/shared/http.ts'
import { createDataExportStore } from '../../src/storage/data-exports.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { bearer, createTestUser, deleteTestUser, type TestUser } from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier, testConfig } from '../support/test-app.ts'

describe('/v1/me/exports', () => {
  let app: App
  let connection: DatabaseConnection
  let ana: TestUser
  let bruno: TestUser

  function call(method: 'GET' | 'POST', url: string, user: TestUser, target = app) {
    return target.inject({ method, url, headers: bearer(user) })
  }

  async function settle(id: string, values: Partial<typeof dataExports.$inferInsert>) {
    await connection.db.update(dataExports).set(values).where(eq(dataExports.id, id))
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    ana = await createTestUser()
    bruno = await createTestUser()
  })

  afterAll(async () => {
    await createDataExportStore(testConfig.supabaseUrl, testConfig.supabaseSecretKey).removeFolder(
      ana.id,
    )
    await deleteTestUser(ana.id)
    await deleteTestUser(bruno.id)
    await app.close()
    await connection.close()
  })

  it('has nothing before the first request', async () => {
    const latest = await call('GET', '/v1/me/exports/latest', ana)

    expect(latest.statusCode).toBe(200)
    expect(latest.json<LatestDataExport>()).toEqual({ export: null })
  })

  it('queues one export and returns the same one while it is being prepared', async () => {
    const first = await call('POST', '/v1/me/exports', ana)
    const again = await call('POST', '/v1/me/exports', ana)

    expect(first.statusCode).toBe(202)
    expect(first.json<DataExport>()).toEqual({
      id: expect.any(String),
      status: 'queued',
      requestedAt: expect.any(String),
      readyAt: null,
      expiresAt: null,
      sizeBytes: null,
    })
    expect(again.statusCode).toBe(200)
    expect(again.json<DataExport>().id).toBe(first.json<DataExport>().id)
    expect(
      (await call('GET', '/v1/me/exports/latest', ana)).json<LatestDataExport>().export?.id,
    ).toBe(first.json<DataExport>().id)
  })

  it('downloads only a ready export, only for its owner and only before it expires', async () => {
    const { id } = (await call('GET', '/v1/me/exports/latest', ana)).json<LatestDataExport>()
      .export ?? {
      id: '',
    }
    expect((await call('GET', `/v1/me/exports/${id}/download`, ana)).statusCode).toBe(409)

    await settle(id, {
      status: 'ready',
      readyAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      storagePath: `${ana.id}/${id}.zip`,
      sizeBytes: 2048,
    })
    await createDataExportStore(testConfig.supabaseUrl, testConfig.supabaseSecretKey).upload(
      `${ana.id}/${id}.zip`,
      new Uint8Array([80, 75, 5, 6]),
      'application/zip',
    )
    const download = await call('GET', `/v1/me/exports/${id}/download`, ana)
    expect(download.statusCode).toBe(200)
    const { url } = download.json<DataExportDownload>()
    expect(url).toContain(`/storage/v1/object/sign/exports/${ana.id}/${id}.zip`)
    expect(url).toMatch(/&download=mycogniai-dados-\d{4}-\d{2}-\d{2}\.zip$/)
    expect((await call('GET', `/v1/me/exports/${id}/download`, bruno)).statusCode).toBe(404)
    expect((await call('GET', `/v1/me/exports/${randomUUID()}/download`, ana)).statusCode).toBe(404)

    await settle(id, { expiresAt: new Date(Date.now() - 1000) })
    expect((await call('GET', `/v1/me/exports/${id}/download`, ana)).statusCode).toBe(409)
  })

  it('keeps each export to its owner and lets people only read them', async () => {
    const seenByBruno = await withUser(connection.db, bruno.id, (tx) =>
      tx.select({ id: dataExports.id }).from(dataExports),
    )
    expect(seenByBruno).toEqual([])
    expect((await call('GET', '/v1/me/exports/latest', bruno)).json<LatestDataExport>()).toEqual({
      export: null,
    })
    await expect(
      withUser(connection.db, bruno.id, (tx) =>
        tx.insert(dataExports).values({ userId: bruno.id, status: 'ready' }),
      ),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
    await expect(
      withUser(connection.db, ana.id, (tx) =>
        tx.update(dataExports).set({ status: 'ready' }).where(eq(dataExports.userId, ana.id)),
      ),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
  })

  it('allows at most three requests a day', async () => {
    const prefix = `e2e-exports-${randomUUID().slice(0, 8)}`
    const redisUrl = process.env.REDIS_URL ?? 'redis://127.0.0.1:56379'
    const limited = await buildTestApp({
      db: connection.db,
      verifier: supabaseVerifier(),
      config: { ...testConfig, redisUrl, queuePrefix: prefix },
    })
    await limited.ready()
    const statuses: number[] = []
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await call('POST', '/v1/me/exports', bruno, limited)
      statuses.push(response.statusCode)
      if (response.statusCode === 202) {
        await settle(response.json<DataExport>().id, { status: 'failed' })
      }
    }
    const blocked = await call('POST', '/v1/me/exports', bruno, limited)
    const connectionToRedis = createRedis(redisUrl)
    const queue = new Queue(dataExportQueueName, { connection: connectionToRedis, prefix })
    const queued = await queue.getJobs(['waiting', 'delayed'])
    await queue.obliterate({ force: true })
    await queue.close()
    await connectionToRedis.quit()
    await limited.close()

    expect(statuses).toEqual([202, 202, 202, 429])
    expect(blocked.json<{ code: string }>().code).toBe('EXPORT_LIMIT')
    expect(queued).toHaveLength(3)
  })
})
