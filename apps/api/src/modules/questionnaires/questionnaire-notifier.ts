import { assignmentLifetimeDays, isLocale, type Locale } from '@mycogni/domain'
import { and, eq, inArray, isNull, lte, sql } from 'drizzle-orm'
import { authUsers } from 'drizzle-orm/supabase'
import type { Database } from '../../db/client.ts'
import { notifications, profiles, questionnaireAssignments } from '../../db/schema/index.ts'
import type { Mailer } from '../../mail/mailer.ts'
import { questionnaireReleasedEmail } from './questionnaire-email.ts'

export interface QuestionnaireSweep {
  notified: number
  expired: number
}

export interface QuestionnaireNotifier {
  released(assignmentId: string): Promise<boolean>
  completed(assignmentId: string): Promise<void>
  sweep(): Promise<QuestionnaireSweep>
}

export interface QuestionnaireNotifierOptions {
  db: Database
  mailer: Mailer
  webUrl: string
}

const fallbackLocale: Locale = 'pt-BR'

export function createQuestionnaireNotifier({
  db,
  mailer,
  webUrl,
}: QuestionnaireNotifierOptions): QuestionnaireNotifier {
  async function claim(assignmentId: string): Promise<string | null> {
    return db.transaction(async (tx) => {
      const [row] = await tx
        .update(questionnaireAssignments)
        .set({ notifiedAt: sql`now()` })
        .where(
          and(
            eq(questionnaireAssignments.id, assignmentId),
            eq(questionnaireAssignments.status, 'assigned'),
            isNull(questionnaireAssignments.notifiedAt),
            lte(questionnaireAssignments.availableFrom, sql`now()`),
          ),
        )
        .returning({ patientId: questionnaireAssignments.patientId })
      if (row === undefined) {
        return null
      }
      await tx.insert(notifications).values({
        userId: row.patientId,
        kind: 'questionnaire_assigned',
        questionnaireAssignmentId: assignmentId,
      })
      return row.patientId
    })
  }

  async function email(patientId: string, assignmentId: string): Promise<void> {
    const [recipient] = await db
      .select({ email: authUsers.email, locale: profiles.locale })
      .from(authUsers)
      .leftJoin(profiles, eq(profiles.id, authUsers.id))
      .where(eq(authUsers.id, patientId))
    if (recipient?.email === undefined || recipient.email === null) {
      return
    }
    await mailer.send(
      questionnaireReleasedEmail(
        recipient.email,
        isLocale(recipient.locale) ? recipient.locale : fallbackLocale,
        `${webUrl}/questionnaires/${assignmentId}`,
      ),
    )
  }

  async function released(assignmentId: string): Promise<boolean> {
    const patientId = await claim(assignmentId)
    if (patientId === null) {
      return false
    }
    await email(patientId, assignmentId)
    return true
  }

  return {
    released,
    async completed(assignmentId) {
      const [assignment] = await db
        .select({ professionalId: questionnaireAssignments.professionalId })
        .from(questionnaireAssignments)
        .where(eq(questionnaireAssignments.id, assignmentId))
      if (assignment !== undefined) {
        await db.insert(notifications).values({
          userId: assignment.professionalId,
          kind: 'questionnaire_completed',
          questionnaireAssignmentId: assignmentId,
        })
      }
    },
    async sweep() {
      const expired = await db
        .update(questionnaireAssignments)
        .set({ status: 'expired' })
        .where(
          and(
            inArray(questionnaireAssignments.status, ['assigned', 'in_progress']),
            lte(
              questionnaireAssignments.availableFrom,
              sql`now() - make_interval(days => ${assignmentLifetimeDays})`,
            ),
          ),
        )
        .returning({ id: questionnaireAssignments.id })
      const due = await db
        .select({ id: questionnaireAssignments.id })
        .from(questionnaireAssignments)
        .where(
          and(
            eq(questionnaireAssignments.status, 'assigned'),
            isNull(questionnaireAssignments.notifiedAt),
            lte(questionnaireAssignments.availableFrom, sql`now()`),
          ),
        )
      let notified = 0
      for (const { id } of due) {
        if (await released(id)) {
          notified += 1
        }
      }
      return { notified, expired: expired.length }
    },
  }
}
