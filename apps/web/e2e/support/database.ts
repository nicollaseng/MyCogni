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
