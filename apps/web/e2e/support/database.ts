import type { PatientInsightContent, ProfessionalInsightContent } from '@mycogni/contracts'
import postgres from 'postgres'
import { localSupabase } from './supabase'

interface InsightSeed {
  patientId: string
  daysAgo: number
  checkInCount: number
}

type InsightRow = InsightSeed &
  (
    | { audience: 'patient'; professionalId: null; content: PatientInsightContent }
    | { audience: 'professional'; professionalId: string; content: ProfessionalInsightContent }
  )

const periodDays = 7

async function withDatabase<T>(work: (sql: postgres.Sql) => Promise<T>): Promise<T> {
  const sql = postgres(localSupabase().DB_URL, { max: 1, onnotice: () => undefined })
  try {
    return await work(sql)
  } finally {
    await sql.end()
  }
}

function insertInsight(row: InsightRow): Promise<string> {
  return withDatabase(async (sql) => {
    const [inserted] = await sql<{ id: string }[]>`
      insert into public.insights
        (patient_id, audience, professional_id, period_start, period_end, check_in_count, content, model, created_at)
      values (
        ${row.patientId},
        ${row.audience},
        ${row.professionalId},
        now() - make_interval(days => ${row.daysAgo + periodDays}),
        now() - make_interval(days => ${row.daysAgo}),
        ${row.checkInCount},
        ${sql.json(row.content)},
        'e2e-seed',
        now() - make_interval(days => ${row.daysAgo})
      )
      returning id`
    if (inserted === undefined) {
      throw new Error('The insight was not seeded')
    }
    return inserted.id
  })
}

export function seedPatientInsight(
  seed: InsightSeed & { content: PatientInsightContent },
): Promise<string> {
  return insertInsight({ ...seed, audience: 'patient', professionalId: null })
}

export function seedProfessionalInsight(
  seed: InsightSeed & { professionalId: string; content: ProfessionalInsightContent },
): Promise<string> {
  return insertInsight({ ...seed, audience: 'professional' })
}

export const previousSharingConsentVersion = '2026-10'

export async function revertSharingTerms(patientId: string): Promise<void> {
  await withDatabase(
    (sql) => sql`
      update public.care_links
      set consent_version = ${previousSharingConsentVersion}, consent_accepted_at = started_at
      where patient_id = ${patientId} and ended_at is null`,
  )
}

export async function notifyInsight(patientId: string, insightId: string): Promise<void> {
  await withDatabase(
    (sql) => sql`
      insert into public.notifications (user_id, kind, insight_id)
      values (${patientId}, 'insight', ${insightId})`,
  )
}

export function emailedTokenHash(email: string, type: 'signup' | 'recovery'): Promise<string> {
  return withDatabase(async (sql) => {
    const [user] = await sql<{ confirmation_token: string; recovery_token: string }[]>`
      select confirmation_token, recovery_token from auth.users where email = ${email}`
    const token = type === 'signup' ? user?.confirmation_token : user?.recovery_token
    if (token === undefined || token === '') {
      throw new Error(`No ${type} email was sent to ${email}`)
    }
    return token
  })
}

const hourInMs = 60 * 60 * 1000

function seededMoments(count: number, now: number): Date[] {
  return Array.from({ length: count }, (_, index) => new Date(now - (index + 1) * 20 * hourInMs))
}

export function seedJournalPages(
  userId: string,
  titles: readonly string[],
  now: Date = new Date(),
): Promise<void> {
  const moments = seededMoments(titles.length, now.getTime())
  return withDatabase(async (sql) => {
    await sql`
      insert into public.journal_entries ${sql(
        titles.map((title, index) => ({
          user_id: userId,
          title,
          plain_text: `${title}. Escrevi um pouco sobre o dia.`,
          body: sql.json({
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: `${title}. Escrevi um pouco sobre o dia.` }],
              },
            ],
          }),
          created_at: moments[index],
          updated_at: moments[index],
        })),
      )}`
  })
}

export interface SeededCheckIn {
  moodLevel: number
  emotions: string[]
  contexts: string[]
  note: string | null
}

export function seedCheckIns(
  userId: string,
  checkIns: readonly SeededCheckIn[],
  now: Date = new Date(),
): Promise<void> {
  const moments = seededMoments(checkIns.length, now.getTime())
  return withDatabase(async (sql) => {
    await sql`
      insert into public.check_ins ${sql(
        checkIns.map((checkIn, index) => ({
          user_id: userId,
          mood_level: checkIn.moodLevel,
          emotions: checkIn.emotions,
          contexts: checkIn.contexts,
          note: checkIn.note,
          recorded_at: moments[index],
        })),
      )}`
  })
}
