import {
  contentLanguageOf,
  isSoundProgrammeId,
  practiceMinutesOf,
  practiceDays,
  practiceMap,
  practiceMapWeeks,
  practiceObservation,
  practiceTotals,
  topPractices,
} from '@mycogni/domain'
import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import { isMoodLevel } from '@/features/mood/mood-levels'
import { ZenTopBar } from '@/features/zen/components/zen-top-bar'
import { PracticeUses, RecentPractice } from '@/features/zen/practice/practice-details'
import { PracticeMap } from '@/features/zen/practice/practice-map'
import { practiceSince, toPracticeSessions } from '@/features/zen/practice/sessions'
import { practiceTitle, type PracticeTitles } from '@/features/zen/practice/titles'
import { fetchCheckInsSince } from '@/shared/lib/api/resources'
import { fetchZenSessions } from '@/shared/lib/api/zen'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'
import { guarded } from '@/shared/lib/settled'

const recentCount = 8

const usedCount = 4

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('zen.practice')
  return { title: t('title') }
}

export default async function ZenPracticePage() {
  const now = new Date()
  const since = practiceSince(now, practiceMapWeeks.full)
  const [{ timezone }, [t, tz, locale, sessions, checkIns]] = await guarded(
    requireOnboardedProfile(),
    Promise.all([
      getTranslations('zen.practice'),
      getTranslations('zen'),
      getLocale(),
      fetchZenSessions(since),
      fetchCheckInsSince(since),
    ]),
  )
  const language = contentLanguageOf(locale)
  const practice = toPracticeSessions(sessions)
  const days = practiceMap(practice, { now, timeZone: timezone, weeks: practiceMapWeeks.full })
  const practised = practiceDays(days)
  const totals = practiceTotals(practice, { now, timeZone: timezone })
  const observation = practiceObservation(
    practice,
    checkIns.map((checkIn) => ({
      moodLevel: checkIn.moodLevel,
      recordedAt: new Date(checkIn.recordedAt),
    })),
    timezone,
  )
  const titles: PracticeTitles = {
    breathing: tz('breathing.title'),
    sound: (programme) =>
      isSoundProgrammeId(programme) ? tz(`sounds.names.${programme}`) : programme,
  }

  return (
    <>
      <ZenTopBar />
      <header className="space-y-3">
        <h1 className="font-serif text-[40px] leading-[1.04] tracking-[-0.02em] sm:text-5xl">
          {t('title')}
        </h1>
        <p className="max-w-[36rem] leading-relaxed text-pretty text-muted-foreground">
          {t('summary')}
        </p>
      </header>

      <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          [t('weekMinutes'), totals.week.minutes],
          [t('weekSessions'), totals.week.sessions],
          [t('monthMinutes'), totals.month.minutes],
          [t('monthSessions'), totals.month.sessions],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-lg bg-surface px-4 py-3.5">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="font-serif text-[32px] leading-tight tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="practice-map" className="space-y-3">
        <h2 id="practice-map" className="text-[15px] font-medium">
          {t('mapTitle')}
        </h2>
        <div className="overflow-x-auto">
          <PracticeMap
            days={days}
            large
            label={t('mapLabel', { days: practised, weeks: practiceMapWeeks.full })}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {practised === 0
            ? t('empty')
            : t('days', { days: practised, weeks: practiceMapWeeks.full })}
        </p>
        {observation !== null && (
          <p
            data-testid="practice-observation"
            className="max-w-[36rem] leading-relaxed text-pretty"
          >
            {t(`observation.${observation}`)}
          </p>
        )}
      </section>

      {practice.length > 0 && (
        <PracticeUses
          items={topPractices(practice, usedCount).map((use) => ({
            key: `${use.kind}:${use.contentId}`,
            kind: use.kind,
            title: practiceTitle(use.kind, use.contentId, language, titles),
            minutes: use.minutes,
            sessions: use.sessions,
          }))}
        />
      )}

      {practice.length > 0 && (
        <RecentPractice
          timeZone={timezone}
          items={sessions.slice(0, recentCount).map((session) => ({
            key: session.id,
            kind: session.kind,
            title: practiceTitle(session.kind, session.contentId, language, titles),
            minutes: Math.max(1, practiceMinutesOf(session.seconds)),
            startedAt: session.startedAt,
            feelingAfter:
              session.feelingAfter !== null && isMoodLevel(session.feelingAfter)
                ? session.feelingAfter
                : null,
          }))}
        />
      )}

      <p className="text-sm text-muted-foreground">{tz('disclaimer')}</p>
    </>
  )
}
