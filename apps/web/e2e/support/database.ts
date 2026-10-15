import postgres from 'postgres'

const databaseUrl =
  process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:55322/postgres'

export async function seedInsightNotification(userId: string): Promise<string> {
  const sql = postgres(databaseUrl, { max: 1 })
  try {
    const [insight] = await sql<{ id: string }[]>`
      insert into public.insights
        (patient_id, audience, period_start, period_end, check_in_count, content, model)
      values
        (${userId}, 'patient', now() - interval '8 days', now(), 7,
         ${sql.json({ summary: 'Semana estável.', highlights: [], suggestions: [] })}, 'e2e')
      returning id`
    if (insight === undefined) {
      throw new Error('The weekly summary was not seeded')
    }
    await sql`
      insert into public.notifications (user_id, kind, insight_id)
      values (${userId}, 'insight', ${insight.id})`
    return insight.id
  } finally {
    await sql.end()
  }
}
