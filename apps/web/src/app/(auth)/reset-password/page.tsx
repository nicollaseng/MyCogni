import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { resendResetCode, verifyResetCode } from '@/features/auth/actions'
import { AuthFootnote, authLink } from '@/features/auth/components/auth-footnote'
import { AuthIntro } from '@/features/auth/components/auth-intro'
import { CodeForm } from '@/features/auth/components/code-form'
import { ResendCode } from '@/features/auth/components/resend-code'
import { codeTiming, pendingEmail } from '@/features/auth/pending-email'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.meta')
  return { title: t('resetPassword') }
}

export default async function ResetPasswordPage() {
  const email = await pendingEmail()
  if (email === null) {
    redirect('/forgot-password')
  }
  const [t, timing] = await Promise.all([getTranslations('auth.resetPassword'), codeTiming()])

  return (
    <>
      <AuthIntro section="resetPassword" email={email} />
      <CodeForm action={verifyResetCode} submitLabel={t('submit')}>
        <ResendCode action={resendResetCode} sentAt={timing.sentAt} now={timing.now} />
      </CodeForm>
      <AuthFootnote>
        {t('wrongEmail')}{' '}
        <Link href="/forgot-password" className={authLink}>
          {t('useAnotherEmail')}
        </Link>
      </AuthFootnote>
    </>
  )
}
