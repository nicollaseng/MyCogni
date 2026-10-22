import { legalConsentKinds } from '@mycogni/domain'
import postgres from 'postgres'
import { localSupabase } from './supabase'

export type LearnedSource = 'check_in' | 'journal' | 'conversation'

export interface LearnedMemory {
  content: string
  kind: 'fact' | 'routine' | 'preference' | 'goal' | 'trigger' | 'coping' | 'relationship' | 'event'
  source: LearnedSource
  daysAgo: number
}

async function withDatabase<T>(work: (sql: postgres.Sql) => Promise<T>): Promise<T> {
  const sql = postgres(localSupabase().DB_URL, { max: 1, onnotice: () => undefined })
  try {
    return await work(sql)
  } finally {
    await sql.end()
  }
}

async function sourceOf(
  sql: postgres.TransactionSql,
  userId: string,
  { source, daysAgo }: LearnedMemory,
): Promise<{ column: string; id: string }> {
  const at = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
  if (source === 'check_in') {
    const [row] = await sql<{ id: string }[]>`
      insert into public.check_ins (user_id, mood_level, note, recorded_at)
      values (${userId}, 4, 'Nota de teste', ${at}) returning id`
    return { column: 'check_in_id', id: row?.id ?? '' }
  }
  if (source === 'journal') {
    const [row] = await sql<{ id: string }[]>`
      insert into public.journal_entries (user_id, plain_text, created_at, updated_at)
      values (${userId}, 'Página de teste', ${at}, ${at}) returning id`
    return { column: 'journal_entry_id', id: row?.id ?? '' }
  }
  const [conversation] = await sql<{ id: string }[]>`
    insert into public.assistant_conversations (owner_id, mode) values (${userId}, 'personal')
    returning id`
  const [message] = await sql<{ id: string }[]>`
    insert into public.assistant_messages (conversation_id, owner_id, role, content, created_at)
    values (${conversation?.id ?? ''}, ${userId}, 'user', 'Mensagem de teste', ${at})
    returning id`
  return { column: 'assistant_message_id', id: message?.id ?? '' }
}

export async function seedLearnedMemories(
  userId: string,
  memories: readonly LearnedMemory[],
): Promise<void> {
  await withDatabase((sql) =>
    sql.begin(async (tx) => {
      for (const memory of memories) {
        const source = await sourceOf(tx, userId, memory)
        const created = new Date(Date.now() - memory.daysAgo * 24 * 60 * 60 * 1000)
        const [row] = await tx<{ id: string }[]>`
          insert into public.assistant_memories (user_id, content, kind, origin, created_at, updated_at)
          values (${userId}, ${memory.content}, ${memory.kind}, 'extracted', ${created}, ${created})
          returning id`
        await tx`
          insert into public.assistant_memory_sources (memory_id, user_id, ${tx(source.column)})
          values (${row?.id ?? ''}, ${userId}, ${source.id})`
      }
    }),
  )
}

export const previousLegalVersion = '2026-10'

export async function revertLegalConsents(userId: string): Promise<void> {
  await withDatabase(
    (sql) => sql`
      update public.consents set version = ${previousLegalVersion}
      where user_id = ${userId} and kind in ${sql([...legalConsentKinds])}`,
  )
}
