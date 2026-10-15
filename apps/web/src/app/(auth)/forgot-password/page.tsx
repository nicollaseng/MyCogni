import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { requestPasswordReset } from '@/features/auth/actions'
import { AuthFootnote, authLink } from '@/features/auth/components/auth-footnote'
import { AuthHeading } from '@/features/auth/components/auth-heading'
import { EmailForm } from '@/features/auth/components/email-form'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.meta')
  return { title: t('forgotPassword') }
}

export default async function ForgotPasswordPage() {
  const t = await getTranslations('auth.forgotPassword')

  return (
    <>
      <AuthHeading title={t('title')}>{t('lead')}</AuthHeading>
      <EmailForm action={requestPasswordReset} submitLabel={t('submit')} />
      <AuthFootnote>
        {t('remembered')}{' '}
        <Link href="/sign-in" className={authLink}>
          {t('signIn')}
        </Link>
      </AuthFootnote>
    </>
  )
}
