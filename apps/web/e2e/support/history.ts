import { instruments, scoreAssessment, type InstrumentId } from '@mycogni/domain'
import postgres from 'postgres'
import { localSupabase } from './supabase'

interface SeededCheckIn {
  daysAgo: number
  hoursAgo: number
  moodLevel: number
  emotions: string[]
  contexts: string[]
  note: string | null
}

const notes = [
  'Caminhei antes do trabalho e o dia rendeu.',
  'Reunião longa, saí cansada.',
  'Jantar com amigos, ri bastante.',
  'Dormi mal e acordei com a cabeça pesada.',
] as const

function clampMood(value: number): number {
  return Math.min(6, Math.max(0, value))
}

function emotionsFor(mood: number): string[] {
  if (mood >= 5) {
    return ['joy', 'calm']
  }
  if (mood >= 4) {
    return ['calm']
  }
  return mood <= 2 ? ['anxiety', 'tiredness'] : ['boredom']
}

export function moodHistory(days: number): SeededCheckIn[] {
  return Array.from({ length: days }, (_, daysAgo) => daysAgo)
    .filter((daysAgo) => daysAgo < 2 || daysAgo % 7 !== 3)
    .flatMap((daysAgo) => {
      const exercise = daysAgo % 3 === 0
      const work = daysAgo % 7 < 5
      const friends = daysAgo % 6 === 2
      const mood = clampMood(
        3 + (exercise ? 1 : 0) + (friends ? 1 : 0) - (work && daysAgo % 2 === 1 ? 1 : 0),
      )
      const contexts = [
        ...(exercise ? ['exercise'] : []),
        ...(work ? ['work'] : []),
        ...(friends ? ['friends'] : []),
      ]
      const entries = daysAgo % 5 === 0 ? [0, 5] : [0]
      return entries.map((hoursAgo, index) => ({
        daysAgo,
        hoursAgo,
        moodLevel: clampMood(mood - index),
        emotions: emotionsFor(mood - index),
        contexts,
        note: (daysAgo + index) % 4 === 0 ? (notes[daysAgo % notes.length] ?? null) : null,
      }))
    })
}

async function withDatabase<T>(work: (sql: postgres.Sql) => Promise<T>): Promise<T> {
  const sql = postgres(localSupabase().DB_URL, { max: 1, onnotice: () => undefined })
  try {
    return await work(sql)
  } finally {
    await sql.end()
  }
}

export async function seedMoodHistory(userId: string, days: number): Promise<number> {
  const history = moodHistory(days)
  await withDatabase(async (sql) => {
    for (const entry of history) {
      await sql`
        insert into public.check_ins (user_id, mood_level, emotions, contexts, note, recorded_at)
        values (
          ${userId},
          ${entry.moodLevel},
          ${entry.emotions},
          ${entry.contexts},
          ${entry.note},
          now() - make_interval(days => ${entry.daysAgo}, hours => ${entry.hoursAgo})
        )`
    }
  })
  return history.length
}

const sessions = [70, 56, 42, 28, 14] as const

function answersFor(instrument: InstrumentId, session: number): number[] {
  const level = Math.max(0, 2 - Math.floor(session / 2))
  return Array.from({ length: instruments[instrument].itemCount }, (_, index) =>
    index === instruments[instrument].riskItemIndex ? 0 : (level + (index % 2)) % 4,
  )
}

export async function seedScoreHistory(userId: string): Promise<void> {
  await withDatabase(async (sql) => {
    for (const [session, daysAgo] of sessions.entries()) {
      for (const instrument of ['phq9', 'gad7'] as const) {
        const answers = answersFor(instrument, session)
        const score = scoreAssessment(instruments[instrument], answers)
        await sql`
          insert into public.assessments
            (user_id, instrument, answers, total_score, severity, has_risk_flag, completed_at)
          values (
            ${userId},
            ${instrument},
            ${answers},
            ${score.totalScore},
            ${score.severity},
            ${score.hasRiskFlag},
            now() - make_interval(days => ${daysAgo})
          )`
      }
    }
  })
}
