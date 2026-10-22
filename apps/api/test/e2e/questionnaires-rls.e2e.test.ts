import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { blankAnswers, scoreQuestionnaire } from '@mycogni/domain'
import { and, eq, sql } from 'drizzle-orm'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { asAnonymous, withUser } from '../../src/db/rls.ts'
import {
  careLinks,
  questionnaireAssignments,
  questionnaireResponses,
} from '../../src/db/schema/index.ts'
import { registerProfessional } from '../support/care.ts'
import { createAuthUser, deleteAuthUsers, testDatabaseUrl } from '../support/database.ts'
import { phq9Calm, seedLink } from '../support/questionnaires.ts'

type NewAssignment = typeof questionnaireAssignments.$inferInsert

type NewResponse = typeof questionnaireResponses.$inferInsert

const policy = { cause: { code: '42501' } }

describe('questionnaire assignments and responses', () => {
  let connection: DatabaseConnection
  let helena: string
  let caio: string
  let dora: string
  let ana: string
  let bruno: string
  let helenaLink: string
  let caioLink: string
  let assignmentId: string

  function release(userId: string, values: Partial<NewAssignment> = {}) {
    return withUser(connection.db, userId, (tx) =>
      tx
        .insert(questionnaireAssignments)
        .values({
          professionalId: helena,
          patientId: ana,
          careLinkId: helenaLink,
          instrumentId: 'phq',
          variant: 'phq9',
          ...values,
        })
        .returning({ id: questionnaireAssignments.id }),
    )
  }

  function start(userId: string, values: Partial<NewResponse> = {}) {
    return withUser(connection.db, userId, (tx) =>
      tx
        .insert(questionnaireResponses)
        .values({
          assignmentId,
          patientId: ana,
          instrumentId: 'phq',
          instrumentVersion: 'phq9@1',
          locale: 'pt-BR',
          answers: blankAnswers('phq9'),
          consentedAt: new Date(),
          ...values,
        })
        .returning({ id: questionnaireResponses.id }),
    )
  }

  function assignmentsSeenBy(userId: string) {
    return withUser(connection.db, userId, (tx) =>
      tx
        .select({ id: questionnaireAssignments.id, status: questionnaireAssignments.status })
        .from(questionnaireAssignments)
        .orderBy(questionnaireAssignments.createdAt),
    )
  }

  function responsesSeenBy(userId: string) {
    return withUser(connection.db, userId, (tx) =>
      tx.select({ id: questionnaireResponses.id }).from(questionnaireResponses),
    )
  }

  async function statusOf(id: string) {
    const [row] = await connection.db
      .select({ status: questionnaireAssignments.status })
      .from(questionnaireAssignments)
      .where(eq(questionnaireAssignments.id, id))
    return row?.status
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    helena = await createAuthUser(connection.db)
    caio = await createAuthUser(connection.db)
    dora = await createAuthUser(connection.db)
    ana = await createAuthUser(connection.db)
    bruno = await createAuthUser(connection.db)
    await registerProfessional(connection.db, helena)
    await registerProfessional(connection.db, caio, { fullName: 'Dr. Caio Reis' })
    await registerProfessional(connection.db, dora, { fullName: 'Dora Lins', status: 'pending' })
    helenaLink = await seedLink(connection.db, helena, ana)
    caioLink = await seedLink(connection.db, caio, ana)
    await seedLink(connection.db, dora, ana)
  })

  afterAll(async () => {
    await deleteAuthUsers(connection.db, [helena, caio, dora, ana, bruno])
    await connection.close()
  })

  it('lets a verified professional release a questionnaire through an active link', async () => {
    const [created] = await release(helena)
    assignmentId = created?.id ?? ''

    expect(assignmentId).not.toBe('')
    expect(await statusOf(assignmentId)).toBe('assigned')
  })

  it('refuses releases outside an active link of the same professional', async () => {
    await expect(release(helena, { patientId: bruno, variant: 'k10' })).rejects.toMatchObject(
      policy,
    )
    await expect(release(helena, { careLinkId: caioLink, variant: 'k10' })).rejects.toMatchObject(
      policy,
    )
    await expect(release(caio, { variant: 'k10' })).rejects.toMatchObject(policy)
  })

  it('refuses releases from unverified professionals and from patients', async () => {
    await expect(release(dora, { professionalId: dora, variant: 'k10' })).rejects.toMatchObject(
      policy,
    )
    await expect(release(ana, { professionalId: ana, variant: 'k10' })).rejects.toMatchObject(
      policy,
    )
  })

  it('refuses releases that forge the lifecycle', async () => {
    await expect(
      release(helena, { variant: 'k10', status: 'completed', completedAt: new Date() }),
    ).rejects.toMatchObject(policy)
    await expect(release(helena, { variant: 'k10', notifiedAt: new Date() })).rejects.toMatchObject(
      policy,
    )
  })

  it('keeps one open questionnaire of each kind per professional and patient', async () => {
    await expect(release(helena)).rejects.toMatchObject({ cause: { code: '23505' } })
  })

  it('shows an assignment only to its patient and to the professional who released it', async () => {
    expect(await assignmentsSeenBy(ana)).toEqual([{ id: assignmentId, status: 'assigned' }])
    expect(await assignmentsSeenBy(helena)).toEqual([{ id: assignmentId, status: 'assigned' }])
    expect(await assignmentsSeenBy(caio)).toEqual([])
    expect(await assignmentsSeenBy(bruno)).toEqual([])
    await expect(
      asAnonymous(connection.db, (tx) => tx.select().from(questionnaireAssignments)),
    ).rejects.toMatchObject(policy)
  })

  it('refuses responses for someone else, for later or already scored', async () => {
    await expect(start(bruno, { patientId: bruno })).rejects.toMatchObject(policy)
    await expect(start(helena, { patientId: helena })).rejects.toMatchObject(policy)
    await expect(
      start(ana, { score: { total: 0 }, completedAt: new Date() }),
    ).rejects.toMatchObject(policy)
    const [later] = await connection.db
      .insert(questionnaireAssignments)
      .values({
        professionalId: helena,
        patientId: ana,
        careLinkId: helenaLink,
        instrumentId: 'gad',
        variant: 'gad7',
        availableFrom: sql`now() + interval '7 days'`,
      })
      .returning({ id: questionnaireAssignments.id })
    await expect(start(ana, { assignmentId: later?.id ?? '' })).rejects.toMatchObject(policy)
  })

  it('starts the patient response and marks the assignment in progress', async () => {
    expect(await start(ana)).toHaveLength(1)
    expect(await statusOf(assignmentId)).toBe('in_progress')
    await expect(start(ana)).rejects.toMatchObject(policy)
  })

  it('hides an unfinished response from every professional', async () => {
    expect(await responsesSeenBy(ana)).toHaveLength(1)
    expect(await responsesSeenBy(helena)).toEqual([])
    expect(await responsesSeenBy(caio)).toEqual([])
  })

  it('lets only the patient save answers while the questionnaire is open', async () => {
    const save = (userId: string) =>
      withUser(connection.db, userId, (tx) =>
        tx
          .update(questionnaireResponses)
          .set({ answers: [0, null, null, null, null, null, null, null, null] })
          .where(eq(questionnaireResponses.assignmentId, assignmentId))
          .returning({ id: questionnaireResponses.id }),
      )

    expect(await save(ana)).toHaveLength(1)
    expect(await save(bruno)).toEqual([])
    expect(await save(helena)).toEqual([])
    await expect(
      withUser(connection.db, ana, (tx) =>
        tx
          .update(questionnaireResponses)
          .set({ locale: 'en-US' })
          .where(eq(questionnaireResponses.assignmentId, assignmentId)),
      ),
    ).rejects.toMatchObject(policy)
  })

  it('never lets the patient change the assignment itself', async () => {
    const cancelled = await withUser(connection.db, ana, (tx) =>
      tx
        .update(questionnaireAssignments)
        .set({ status: 'cancelled', cancelledAt: new Date() })
        .where(eq(questionnaireAssignments.id, assignmentId))
        .returning({ id: questionnaireAssignments.id }),
    )
    expect(cancelled).toEqual([])
    await expect(
      withUser(connection.db, ana, (tx) =>
        tx
          .update(questionnaireAssignments)
          .set({ note: 'mudado' })
          .where(eq(questionnaireAssignments.id, assignmentId)),
      ),
    ).rejects.toMatchObject(policy)
  })

  it('shows the finished result only to the professional who released it', async () => {
    const { score, flags } = scoreQuestionnaire('phq9', phq9Calm)
    const completed = await withUser(connection.db, ana, (tx) =>
      tx
        .update(questionnaireResponses)
        .set({ answers: phq9Calm, score, flags, completedAt: new Date() })
        .where(eq(questionnaireResponses.assignmentId, assignmentId))
        .returning({ id: questionnaireResponses.id }),
    )

    expect(completed).toHaveLength(1)
    expect(await statusOf(assignmentId)).toBe('completed')
    expect(await responsesSeenBy(helena)).toHaveLength(1)
    expect(await responsesSeenBy(caio)).toEqual([])
    expect(await responsesSeenBy(bruno)).toEqual([])
  })

  it('does not let anyone change a completed response or delete rows', async () => {
    const changed = await withUser(connection.db, ana, (tx) =>
      tx
        .update(questionnaireResponses)
        .set({ answers: blankAnswers('phq9') })
        .where(eq(questionnaireResponses.assignmentId, assignmentId))
        .returning({ id: questionnaireResponses.id }),
    )
    expect(changed).toEqual([])
    for (const userId of [ana, helena]) {
      await expect(
        withUser(connection.db, userId, (tx) =>
          tx.delete(questionnaireResponses).where(eq(questionnaireResponses.patientId, ana)),
        ),
      ).rejects.toMatchObject(policy)
      await expect(
        withUser(connection.db, userId, (tx) =>
          tx.delete(questionnaireAssignments).where(eq(questionnaireAssignments.patientId, ana)),
        ),
      ).rejects.toMatchObject(policy)
    }
  })

  it('lets the professional only cancel an open questionnaire of their own', async () => {
    const [open] = await release(helena, { instrumentId: 'kessler', variant: 'k10' })
    const id = open?.id ?? ''
    const cancel = (userId: string) =>
      withUser(connection.db, userId, (tx) =>
        tx
          .update(questionnaireAssignments)
          .set({ status: 'cancelled', cancelledAt: new Date() })
          .where(eq(questionnaireAssignments.id, id))
          .returning({ id: questionnaireAssignments.id }),
      )

    expect(await cancel(caio)).toEqual([])
    await expect(
      withUser(connection.db, helena, (tx) =>
        tx
          .update(questionnaireAssignments)
          .set({ status: 'completed', completedAt: new Date() })
          .where(eq(questionnaireAssignments.id, id)),
      ),
    ).rejects.toMatchObject(policy)
    await expect(
      withUser(connection.db, helena, (tx) =>
        tx
          .update(questionnaireAssignments)
          .set({ repeatEveryDays: 7 })
          .where(eq(questionnaireAssignments.id, id)),
      ),
    ).rejects.toMatchObject(policy)
    expect(await cancel(helena)).toEqual([{ id }])
    expect(await cancel(helena)).toEqual([])
  })

  it('cancels open questionnaires and closes the professional view when the link ends', async () => {
    const [open] = await release(helena, { instrumentId: 'asrs', variant: 'asrs6' })
    await withUser(connection.db, ana, (tx) =>
      tx
        .update(careLinks)
        .set({ endedAt: new Date(), endedBy: 'patient' })
        .where(and(eq(careLinks.id, helenaLink), eq(careLinks.patientId, ana))),
    )

    expect(await statusOf(open?.id ?? '')).toBe('cancelled')
    expect(await assignmentsSeenBy(helena)).toEqual([])
    expect(await responsesSeenBy(helena)).toEqual([])
    expect((await assignmentsSeenBy(ana)).length).toBeGreaterThan(0)
    expect(await responsesSeenBy(ana)).toHaveLength(1)
    await expect(release(helena, { variant: 'k6' })).rejects.toMatchObject(policy)
  })
})
