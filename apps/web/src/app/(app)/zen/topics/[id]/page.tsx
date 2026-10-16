import { contentLanguageOf, isTopicId, topics } from '@mycogni/domain'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { SafetyPanel } from '@/features/safety/components/safety-panel'
import { BreatheButton } from '@/features/zen/components/breathe-button'
import { ReadingRows, TrackRows } from '@/features/zen/components/library'
import { ZenTopBar } from '@/features/zen/components/zen-top-bar'
import { fetchCareLinks } from '@/shared/lib/api/care'
import { fetchStepProgress } from '@/shared/lib/api/zen'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'
import { guarded } from '@/shared/lib/settled'

export async function generateMetadata({
  params,
}: PageProps<'/zen/topics/[id]'>): Promise<Metadata> {
  const [{ id }, t] = await Promise.all([params, getTranslations('zen.topics')])
  return isTopicId(id) ? { title: t(`names.${id}`) } : {}
}

export default async function ZenTopicPage({ params }: PageProps<'/zen/topics/[id]'>) {
  const [[{ id }], [t, locale, doneSteps, careLinks]] = await guarded(
    Promise.all([params, requireOnboardedProfile()]),
    Promise.all([getTranslations('zen'), getLocale(), fetchStepProgress(), fetchCareLinks()]),
  )
  if (!isTopicId(id)) {
    notFound()
  }
  const language = contentLanguageOf(locale)
  const topic = topics[id]
  const professionals = careLinks.map((link) => link.professional.name)

  return (
    <>
      <ZenTopBar />
      <h1 className="font-serif text-[40px] leading-[1.04] tracking-[-0.02em] text-balance sm:text-5xl">
        {t(`topics.names.${id}`)}
      </h1>
      {id === 'help' && <SafetyPanel level="watch" professionals={professionals} />}
      <TrackRows
        ids={[topic.track]}
        doneSteps={doneSteps}
        language={language}
        title={t('topics.track')}
      />
      {topic.breathe && <BreatheButton label={t('quickBreathe')} />}
      <ReadingRows ids={topic.articles} language={language} title={t('topics.readings')} />
      <p className="text-sm text-muted-foreground">{t('disclaimer')}</p>
    </>
  )
}
