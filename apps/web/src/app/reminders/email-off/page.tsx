import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Wordmark } from '@/shared/components/wordmark'
import { turnEmailRemindersOff } from '@/shared/lib/api/reminders'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('reminders.emailOff.meta')
  return { title: t('title'), robots: { index: false } }
}

export default async function EmailRemindersOffPage({
  searchParams,
}: PageProps<'/reminders/email-off'>) {
  const { token } = await searchParams
  const [done, t] = await Promise.all([
    typeof token === 'string' ? turnEmailRemindersOff(token) : Promise.resolve(false),
    getTranslations('reminders.emailOff'),
  ])

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[460px] flex-col px-6 pt-8 pb-10">
      <Wordmark className="self-start" />
      <div className="mt-16 space-y-3">
        <h1 className="font-serif text-[32px] leading-[1.08] tracking-[-0.02em] text-balance">
          {done ? t('title') : t('invalidTitle')}
        </h1>
        <p className="text-[15px] leading-relaxed text-pretty text-muted-foreground">
          {done ? t('body') : t('invalidBody')}
        </p>
      </div>
      <Link
        href="/me/reminders"
        className="mt-8 self-start text-[15px] underline decoration-1 underline-offset-4"
      >
        {t('settings')}
      </Link>
    </main>
  )
}
