import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { resendCode, verifyEmail } from '@/features/auth/actions'
import { AuthFootnote, authLink } from '@/features/auth/components/auth-footnote'
import { AuthIntro } from '@/features/auth/components/auth-intro'
import { CodeForm } from '@/features/auth/components/code-form'
import { ResendCode } from '@/features/auth/components/resend-code'
import { codeTiming, pendingEmail } from '@/features/auth/pending-email'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.meta')
  return { title: t('verify') }
}

export default async function VerifyPage() {
  const email = await pendingEmail()
  if (email === null) {
    redirect('/sign-up')
  }
  const [t, timing] = await Promise.all([getTranslations('auth.verify'), codeTiming()])

  return (
    <>
      <AuthIntro section="verify" email={email} />
      <CodeForm action={verifyEmail} submitLabel={t('submit')}>
        <ResendCode action={resendCode} sentAt={timing.sentAt} now={timing.now} />
      </CodeForm>
      <AuthFootnote>
        {t('wrongEmail')}{' '}
        <Link href="/sign-up" className={authLink}>
          {t('useAnotherEmail')}
        </Link>
      </AuthFootnote>
    </>
  )
}
