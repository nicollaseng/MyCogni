import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { resendCode, verifyEmail } from '@/features/auth/actions'
import { AuthFootnote, authLink } from '@/features/auth/components/auth-footnote'
import { AuthIntro } from '@/features/auth/components/auth-intro'
import { CodeForm } from '@/features/auth/components/code-form'
import { SingleActionButton } from '@/features/auth/components/single-action-button'
import { pendingEmail } from '@/features/auth/pending-email'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.meta')
  return { title: t('verify') }
}

export default async function VerifyPage() {
  const email = await pendingEmail()
  if (email === null) {
    redirect('/sign-up')
  }
  const t = await getTranslations('auth.verify')

  return (
    <>
      <AuthIntro section="verify" email={email} />
      <CodeForm action={verifyEmail} submitLabel={t('submit')} />
      <div className="mt-4">
        <SingleActionButton action={resendCode} pendingLabel={t('resending')} variant="ghost">
          {t('resend')}
        </SingleActionButton>
      </div>
      <AuthFootnote>
        {t('wrongEmail')}{' '}
        <Link href="/sign-up" className={authLink}>
          {t('useAnotherEmail')}
        </Link>
      </AuthFootnote>
    </>
  )
}
