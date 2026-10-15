import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { professionalDocumentBucket, sharingConsentVersion } from '@mycogni/domain'
import { eq, sql } from 'drizzle-orm'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { withUser } from '../../src/db/rls.ts'
import {
  careLinks,
  professionalDocuments,
  professionalProfiles,
} from '../../src/db/schema/index.ts'
import { makeAdmin, registerProfessional } from '../support/care.ts'
import { createAuthUser, deleteAuthUsers, testDatabaseUrl } from '../support/database.ts'

describe('professional documents', () => {
  let connection: DatabaseConnection
  let helena: string
  let caio: string
  let ana: string
  let admin: string
  let helenaDocument: string

  async function storedFile(owner: string): Promise<string> {
    const path = `${owner}/${randomUUID()}.pdf`
    await connection.db.execute(
      sql`insert into storage.objects (bucket_id, name, owner_id) values (${professionalDocumentBucket}, ${path}, ${owner})`,
    )
    return path
  }

  function send(userId: string, values: { userId: string; path: string }) {
    return withUser(connection.db, userId, (tx) =>
      tx
        .insert(professionalDocuments)
        .values({ ...values, fileName: 'CRP.pdf', contentType: 'application/pdf', sizeBytes: 2048 })
        .returning({ id: professionalDocuments.id }),
    )
  }

  function documentsSeenBy(userId: string): Promise<string[]> {
    return withUser(connection.db, userId, async (tx) => {
      const rows = await tx
        .select({ userId: professionalDocuments.userId })
        .from(professionalDocuments)
        .where(eq(professionalDocuments.userId, helena))
      return rows.map((row) => row.userId)
    })
  }

  function statusOf(userId: string) {
    return connection.db
      .select({ status: professionalProfiles.status, note: professionalProfiles.reviewNote })
      .from(professionalProfiles)
      .where(eq(professionalProfiles.userId, userId))
  }

  function call<T extends Record<string, unknown>>(userId: string, query: ReturnType<typeof sql>) {
    return withUser(connection.db, userId, async (tx) => Array.from(await tx.execute<T>(query))[0])
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    helena = await createAuthUser(connection.db)
    caio = await createAuthUser(connection.db)
    ana = await createAuthUser(connection.db)
    admin = await createAuthUser(connection.db)
    await makeAdmin(connection.db, admin)
    await registerProfessional(connection.db, helena, { status: 'pending' })
    await registerProfessional(connection.db, caio, { fullName: 'Caio Mendes' })
    await connection.db
      .insert(careLinks)
      .values({ professionalId: caio, patientId: ana, consentVersion: sharingConsentVersion })
    const [sent] = await send(helena, { userId: helena, path: await storedFile(helena) })
    helenaDocument = sent?.id ?? ''
  })

  afterAll(async () => {
    await connection.db.transaction(async (tx) => {
      await tx.execute(sql`select set_config('storage.allow_delete_query', 'true', true)`)
      await tx.execute(
        sql`delete from storage.objects where bucket_id = ${professionalDocumentBucket} and owner_id in (${helena}, ${caio}, ${ana})`,
      )
    })
    await deleteAuthUsers(connection.db, [helena, caio, ana, admin])
    await connection.close()
  })

  it('shows a document only to its professional and to the MyCogniAI team', async () => {
    expect(helenaDocument).not.toBe('')
    expect(await documentsSeenBy(helena)).toEqual([helena])
    expect(await documentsSeenBy(admin)).toEqual([helena])
    expect(await documentsSeenBy(caio)).toEqual([])
    expect(await documentsSeenBy(ana)).toEqual([])
  })

  it('accepts only files already stored in the folder of the professional who sends them', async () => {
    await expect(
      send(helena, { userId: helena, path: `${helena}/${randomUUID()}.pdf` }),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
    await expect(
      send(helena, { userId: caio, path: await storedFile(caio) }),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
    await expect(
      send(helena, { userId: helena, path: await storedFile(caio) }),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
  })

  it('does not take documents from patients or from verified professionals', async () => {
    await expect(send(ana, { userId: ana, path: await storedFile(ana) })).rejects.toMatchObject({
      cause: { code: '42501' },
    })
    await expect(send(caio, { userId: caio, path: await storedFile(caio) })).rejects.toMatchObject({
      cause: { code: '42501' },
    })
  })

  it('does not let anyone change or delete a document that was sent', async () => {
    for (const userId of [helena, admin]) {
      await expect(
        withUser(connection.db, userId, (tx) =>
          tx
            .update(professionalDocuments)
            .set({ fileName: 'outro.pdf' })
            .where(eq(professionalDocuments.id, helenaDocument)),
        ),
      ).rejects.toMatchObject({ cause: { code: '42501' } })
      await expect(
        withUser(connection.db, userId, (tx) =>
          tx.delete(professionalDocuments).where(eq(professionalDocuments.id, helenaDocument)),
        ),
      ).rejects.toMatchObject({ cause: { code: '42501' } })
    }
  })

  it('lets only the team review, and reopens the review only after a new document', async () => {
    const review = (userId: string) =>
      call<{ reviewed: boolean }>(
        userId,
        sql`select public.review_professional(${helena}, 'rejected', 'Documento ilegível') as reviewed`,
      )
    const reopen = () =>
      call<{ reopened: boolean }>(
        helena,
        sql`select public.reopen_professional_review() as reopened`,
      )

    expect(await review(helena)).toEqual({ reviewed: false })
    expect(await review(caio)).toEqual({ reviewed: false })
    expect(await review(admin)).toEqual({ reviewed: true })
    expect(await statusOf(helena)).toEqual([{ status: 'rejected', note: 'Documento ilegível' }])

    expect(await reopen()).toEqual({ reopened: false })
    await send(helena, { userId: helena, path: await storedFile(helena) })
    expect(await reopen()).toEqual({ reopened: true })
    expect(await statusOf(helena)).toEqual([{ status: 'pending', note: 'Documento ilegível' }])
  })
})
