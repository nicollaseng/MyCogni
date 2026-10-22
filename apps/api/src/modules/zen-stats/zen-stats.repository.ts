import { sql } from 'drizzle-orm'
import type { Database } from '../../db/client.ts'
import { withUser } from '../../db/rls.ts'

export interface PracticeStatsRow extends Record<string, unknown> {
  kind: string
  content_id: string
  people: number | null
  starts: number | null
  completions: number | null
  median_seconds: number | null
  compared_people: number | null
  better: number | null
  same: number | null
  worse: number | null
}

export interface TrackStatsRow extends Record<string, unknown> {
  track_id: string
  people: number | null
  completions: number | null
}

export interface ZenStatsRows {
  admin: boolean
  practice: PracticeStatsRow[]
  tracks: TrackStatsRow[]
}

export interface ZenStatsRepository {
  read(
    userId: string,
    trackSteps: Readonly<Record<string, readonly string[]>>,
  ): Promise<ZenStatsRows>
}

export function createZenStatsRepository(db: Database): ZenStatsRepository {
  return {
    read(userId, trackSteps) {
      return withUser(db, userId, async (tx) => {
        const [check] = Array.from(
          await tx.execute<{ admin: boolean }>(sql`select public.is_admin() as admin`),
        )
        if (check?.admin !== true) {
          return { admin: false, practice: [], tracks: [] }
        }
        const practice = Array.from(
          await tx.execute<PracticeStatsRow>(sql`select * from public.zen_practice_stats()`),
        )
        const tracks = Array.from(
          await tx.execute<TrackStatsRow>(
            sql`select * from public.zen_track_stats(${JSON.stringify(trackSteps)}::jsonb)`,
          ),
        )
        return { admin: true, practice, tracks }
      })
    },
  }
}
