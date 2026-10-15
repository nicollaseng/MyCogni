import { dailyMoods } from '@mycogni/domain'
import type { Metadata } from 'next'
import Link from 'next/link'
import { MoodMap } from '@/features/mood/components/mood-map'
import { MoodStrip } from '@/features/mood/components/mood-strip'
import { isMoodLevel } from '@/features/mood/mood-levels'
import { LatestScreening } from '@/features/screening/components/latest-screening'
import { latestByInstrument } from '@/features/screening/latest'
import { PageTitle } from '@/shared/components/page-title'
import { Panel, Section } from '@/shared/components/section'
import { fetchAssessments, fetchCheckIns } from '@/shared/lib/api/resources'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'
import { formatLongDate } from '@/shared/lib/time'
import { cn } from '@/shared/lib/utils'
import { buttonVariants } from '@/shared/ui/button'

export const metadata: Metadata = { title: 'Hoje' }

const windowDays = 14
const dayInMs = 24 * 60 * 60 * 1000

export default async function TodayPage() {
  const { timezone } = await requireOnboardedProfile()
  const now = new Date()
  const today = formatLongDate(now, timezone)
  const [checkIns, assessments] = await Promise.all([
    fetchCheckIns({ since: new Date(now.getTime() - (windowDays + 1) * dayInMs), limit: 200 }),
    fetchAssessments(),
  ])
  const days = dailyMoods(
    checkIns.map((checkIn) => ({
      moodLevel: checkIn.moodLevel,
      recordedAt: new Date(checkIn.recordedAt),
    })),
    { timeZone: timezone, today: now, days: windowDays },
  ).map((level) => (level !== null && isMoodLevel(level) ? level : null))
  const recordedDays = days.filter((level) => level !== null).length

  return (
    <>
      <PageTitle kicker={today} title="Como você está agora?" />

      <section className="flex items-center gap-6 sm:gap-10">
        <MoodMap valence={0.5} rings={9} className="size-32 shrink-0 sm:size-40" />
        <div className="space-y-4">
          <p className="leading-relaxed text-muted-foreground">
            Leva menos de um minuto. Num dia difícil, só o humor já basta.
          </p>
          <Link href="/check-in" className={cn(buttonVariants({ shape: 'pill' }))}>
            Registrar como estou
          </Link>
        </div>
      </section>

      <Section title="Últimos 14 dias">
        <Panel className="space-y-4 py-5">
          <MoodStrip
            days={days}
            label={
              recordedDays === 0
                ? 'Nenhum dia registrado nos últimos 14 dias'
                : `Humor de ${String(recordedDays)} dos últimos 14 dias`
            }
          />
          <p className="text-sm text-muted-foreground">
            {recordedDays === 0
              ? 'Seus dias aparecem aqui conforme você registra.'
              : `${String(recordedDays)} de 14 dias com registro.`}
          </p>
        </Panel>
      </Section>

      <LatestScreening results={latestByInstrument(assessments)} timeZone={timezone} />
    </>
  )
}
