import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { resetPassword } from '@/features/auth/actions'
import { AuthFootnote, authLink } from '@/features/auth/components/auth-footnote'
import { AuthHeading } from '@/features/auth/components/auth-heading'
import { CodeForm } from '@/features/auth/components/code-form'
import { pendingEmail } from '@/features/auth/pending-email'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.meta')
  return { title: t('resetPassword') }
}

export default async function ResetPasswordPage() {
  const email = await pendingEmail()
  if (email === null) {
    redirect('/forgot-password')
  }
  const t = await getTranslations('auth.resetPassword')

  return (
    <>
      <AuthHeading title={t('title')}>
        {t.rich('lead', {
          email,
          highlight: (chunks) => <span className="text-foreground">{chunks}</span>,
        })}
      </AuthHeading>
      <CodeForm action={resetPassword} withNewPassword submitLabel={t('submit')} />
      <AuthFootnote>
        {t('notReceived')}{' '}
        <Link href="/forgot-password" className={authLink}>
          {t('sendAnother')}
        </Link>
      </AuthFootnote>
    </>
  )
}
