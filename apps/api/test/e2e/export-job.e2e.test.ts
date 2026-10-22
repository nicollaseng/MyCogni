import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { and, eq } from 'drizzle-orm'
import yauzl from 'yauzl'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import {
  assistantConversations,
  assistantMessages,
  checkIns,
  dataExports,
  journalEntries,
  notifications,
  profiles,
  zenSessions,
} from '../../src/db/schema/index.ts'
import type { Email, Mailer } from '../../src/mail/mailer.ts'
import { createExportCollector } from '../../src/modules/exports/export-collector.ts'
import { createDataExportJob, type DataExportJob } from '../../src/modules/exports/export-job.ts'
import { archiveFilesOf, createExportNotifier } from '../../src/modules/exports/export-notifier.ts'
import { createDataExportRepository } from '../../src/modules/exports/export.repository.ts'
import type { BucketStore } from '../../src/storage/bucket-store.ts'
import { createDataExportStore } from '../../src/storage/data-exports.ts'
import { createJournalImageStore } from '../../src/storage/journal-images.ts'
import { createProfileFileStores } from '../../src/storage/profile-files.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { tinyPng } from '../support/storage.ts'
import { createTestUser, deleteTestUser, type TestUser } from '../support/supabase.ts'
import { testConfig } from '../support/test-app.ts'

class FakeMailer implements Mailer {
  readonly sent: Email[] = []

  send(email: Email): Promise<boolean> {
    this.sent.push(email)
    return Promise.resolve(true)
  }
}

async function zipEntries(stream: ReadableStream<Uint8Array>): Promise<Map<string, Buffer>> {
  const archive = Buffer.from(await new Response(stream).arrayBuffer())
  const zip = await new Promise<yauzl.ZipFile>((resolve, reject) => {
    yauzl.fromBuffer(archive, { lazyEntries: true }, (error, file) => {
      if (error !== null) {
        reject(error)
      } else {
        resolve(file)
      }
    })
  })
  const entries = new Map<string, Buffer>()
  await new Promise<void>((resolve, reject) => {
    zip.on('entry', (entry: yauzl.Entry) => {
      zip.openReadStream(entry, (error, read) => {
        if (error !== null) {
          reject(error)
          return
        }
        const parts: Buffer[] = []
        read.on('data', (part: Buffer) => parts.push(part))
        read.on('end', () => {
          entries.set(entry.fileName, Buffer.concat(parts))
          zip.readEntry()
        })
      })
    })
    zip.on('end', () => {
      resolve()
    })
    zip.on('error', reject)
    zip.readEntry()
  })
  return entries
}

describe('data export job', () => {
  let connection: DatabaseConnection
  let marina: TestUser
  let mailer: FakeMailer
  let job: DataExportJob
  const journal = createJournalImageStore(testConfig.supabaseUrl, testConfig.supabaseSecretKey)
  const profileFiles = createProfileFileStores(testConfig.supabaseUrl, testConfig.supabaseSecretKey)
  const store = createDataExportStore(testConfig.supabaseUrl, testConfig.supabaseSecretKey)
  const pagePhoto = () => `${marina.id}/${pageId}/folha.png`
  const pageId = randomUUID()

  function jobWith(target: Pick<BucketStore, 'uploadFile' | 'remove'>, now = () => new Date()) {
    return createDataExportJob({
      exports: createDataExportRepository(connection.db),
      collector: createExportCollector(connection.db),
      files: archiveFilesOf({
        journal,
        avatar: profileFiles.photos,
        documents: profileFiles.documents,
      }),
      store: target,
      notifier: createExportNotifier(connection.db),
      mailer,
      webUrl: 'https://app.exemplo.com',
      log: { error: () => undefined },
      now,
    })
  }

  async function requestExport(): Promise<string> {
    const [row] = await connection.db
      .insert(dataExports)
      .values({ userId: marina.id })
      .returning({ id: dataExports.id })
    return row?.id ?? ''
  }

  async function status(id: string) {
    const [row] = await connection.db.select().from(dataExports).where(eq(dataExports.id, id))
    return row
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    marina = await createTestUser({ full_name: 'Marina Alves', locale: 'pt-BR' })
    mailer = new FakeMailer()
    job = jobWith(store)
    await journal.upload(pagePhoto(), tinyPng, 'image/png')
    await profileFiles.photos.upload(`${marina.id}/avatar.png`, tinyPng, 'image/png')
    await connection.db
      .update(profiles)
      .set({ avatarPath: `${marina.id}/avatar.png` })
      .where(eq(profiles.id, marina.id))
    await connection.db.insert(checkIns).values({
      userId: marina.id,
      moodLevel: 5,
      note: '=HYPERLINK("x"), dormi bem',
      recordedAt: new Date('2026-10-20T12:00:00Z'),
    })
    await connection.db.insert(journalEntries).values({
      id: pageId,
      userId: marina.id,
      title: 'Domingo <calmo>',
      body: {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: '<script>alert(1)</script>' }] },
          { type: 'image', attrs: { path: pagePhoto() } },
        ],
      },
      plainText: '<script>alert(1)</script>',
      imagePaths: [pagePhoto()],
      createdAt: new Date('2026-10-19T12:00:00Z'),
    })
    await connection.db.insert(zenSessions).values({
      userId: marina.id,
      kind: 'meditation',
      contentId: 'body-scan',
      startedAt: new Date('2026-10-20T22:00:00Z'),
      secondsCompleted: 300,
      completed: true,
      feelingAfter: 5,
    })
    const [conversation] = await connection.db
      .insert(assistantConversations)
      .values({
        ownerId: marina.id,
        mode: 'personal',
        createdAt: new Date('2026-10-21T12:00:00Z'),
      })
      .returning({ id: assistantConversations.id })
    await connection.db.insert(assistantMessages).values([
      {
        conversationId: conversation?.id ?? '',
        ownerId: marina.id,
        role: 'user',
        content: 'Oi Cogni',
      },
      {
        conversationId: conversation?.id ?? '',
        ownerId: marina.id,
        role: 'assistant',
        content: 'Oi, Marina.',
      },
    ])
  })

  afterAll(async () => {
    await journal.removeFolder(marina.id)
    await profileFiles.photos.removeFolder(marina.id)
    await store.removeFolder(marina.id)
    await deleteTestUser(marina.id)
    await connection.close()
  })

  it('builds the archive, stores it privately and tells the person where to download it', async () => {
    const id = await requestExport()

    const result = await job.run(id)

    expect(result).toEqual({ kind: 'ready', size: expect.any(Number) })
    const row = await status(id)
    expect(row).toEqual(
      expect.objectContaining({
        status: 'ready',
        storagePath: `${marina.id}/${id}.zip`,
        sizeBytes: expect.any(Number),
        startedAt: expect.any(Date),
        readyAt: expect.any(Date),
      }),
    )
    expect((row?.expiresAt?.getTime() ?? 0) - (row?.readyAt?.getTime() ?? 0)).toBe(
      7 * 24 * 60 * 60 * 1000,
    )

    const entries = await zipEntries(await store.open(`${marina.id}/${id}.zip`))
    expect([...entries.keys()].sort()).toEqual([
      'LEIA-ME.txt',
      'conversas/2026-10-21-oi-cogni.md',
      'dados.json',
      'fotos/2026-10-19-domingo-calmo-1.png',
      'memorias.csv',
      'mybook/2026-10-19-domingo-calmo.html',
      'perfil/foto.png',
      'registros.csv',
    ])
    const data = JSON.parse(entries.get('dados.json')?.toString('utf8') ?? '{}') as {
      schemaVersion: number
      account: { email: string }
      checkIns: unknown[]
      mybook: { pages: { file: string; photos: { file: string }[] }[] }
      conversations: { messages: unknown[] }[]
      profile: { photo: string }
      zen: { sessions: { kind: string; contentId: string; completed: boolean }[] }
    }
    expect(data.schemaVersion).toBe(1)
    expect(data.account.email).toBe(marina.email)
    expect(data.checkIns).toHaveLength(1)
    expect(data.mybook.pages[0]?.photos[0]?.file).toBe('fotos/2026-10-19-domingo-calmo-1.png')
    expect(data.conversations[0]?.messages).toHaveLength(2)
    expect(data.profile.photo).toBe('perfil/foto.png')
    expect(data.zen.sessions).toEqual([
      expect.objectContaining({ kind: 'meditation', contentId: 'body-scan', completed: true }),
    ])
    expect(entries.get('fotos/2026-10-19-domingo-calmo-1.png')?.equals(tinyPng)).toBe(true)
    const page = entries.get('mybook/2026-10-19-domingo-calmo.html')?.toString('utf8') ?? ''
    expect(page).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(page).not.toContain('<script>')
    expect(page).toContain('src="../fotos/2026-10-19-domingo-calmo-1.png"')
    expect(entries.get('registros.csv')?.toString('utf8')).toContain(
      '"\'=HYPERLINK(""x""), dormi bem"',
    )
    expect(entries.get('LEIA-ME.txt')?.toString('utf8')).toContain('dados.json')

    const bell = await connection.db
      .select({ kind: notifications.kind })
      .from(notifications)
      .where(eq(notifications.userId, marina.id))
    expect(bell).toEqual([{ kind: 'export_ready' }])
    const [email] = mailer.sent
    expect(email?.to).toBe(marina.email)
    expect(email?.subject).toBe('Seus dados estão prontos')
    expect(email?.text).toContain('https://app.exemplo.com/me/privacy#data')
    expect(email?.text).not.toContain('.zip')
    expect(email?.text).not.toContain('dormi bem')
  })

  it('does nothing for an export that is not waiting', async () => {
    const [row] = await connection.db
      .select({ id: dataExports.id })
      .from(dataExports)
      .where(eq(dataExports.userId, marina.id))

    expect(await job.run(row?.id ?? '')).toEqual({ kind: 'skipped' })
  })

  it('marks a failed export, without content in the error, and asks to try again', async () => {
    const id = await requestExport()
    const broken: Pick<BucketStore, 'uploadFile' | 'remove'> = {
      uploadFile: () => Promise.reject(new TypeError('Upload of dormi bem failed')),
      remove: () => Promise.resolve(),
    }

    expect(await jobWith(broken).run(id)).toEqual({ kind: 'failed', reason: 'TypeError' })
    expect(await status(id)).toEqual(
      expect.objectContaining({ status: 'failed', error: 'TypeError' }),
    )
    const bell = await connection.db
      .select({ kind: notifications.kind })
      .from(notifications)
      .where(eq(notifications.userId, marina.id))
    expect(bell.map((entry) => entry.kind).sort()).toEqual(['export_failed', 'export_ready'])
  })

  it('removes expired files and gives up on exports stuck for hours', async () => {
    const [ready] = await connection.db
      .select({ id: dataExports.id, storagePath: dataExports.storagePath })
      .from(dataExports)
      .where(and(eq(dataExports.status, 'ready'), eq(dataExports.userId, marina.id)))
    const stuck = await requestExport()
    await connection.db
      .update(dataExports)
      .set({ requestedAt: new Date(Date.now() - 4 * 60 * 60 * 1000) })
      .where(eq(dataExports.id, stuck))
    const later = jobWith(store, () => new Date(Date.now() + 8 * 24 * 60 * 60 * 1000))

    const swept = await later.sweep()

    expect(swept.expired).toBeGreaterThanOrEqual(1)
    expect(swept.failed).toBeGreaterThanOrEqual(1)
    expect(await status(ready?.id ?? '')).toEqual(
      expect.objectContaining({ status: 'expired', storagePath: null }),
    )
    expect(await status(stuck)).toEqual(expect.objectContaining({ status: 'failed' }))
    await expect(store.open(ready?.storagePath ?? '')).rejects.toThrow()
  })
})
