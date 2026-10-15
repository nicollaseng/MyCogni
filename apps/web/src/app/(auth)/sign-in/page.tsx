import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { signIn, signInWithGoogle } from '@/features/auth/actions'
import { AuthFootnote, authLink } from '@/features/auth/components/auth-footnote'
import { AuthHeading } from '@/features/auth/components/auth-heading'
import { CredentialsForm } from '@/features/auth/components/credentials-form'
import { GoogleSignIn } from '@/features/auth/components/google-sign-in'
import { redirectSignedInUser } from '@/shared/lib/auth/session'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.meta')
  return { title: t('signIn') }
}

export default async function SignInPage({ searchParams }: PageProps<'/sign-in'>) {
  await redirectSignedInUser()
  const [{ error }, t] = await Promise.all([searchParams, getTranslations('auth.signIn')])

  return (
    <>
      <AuthHeading title={t('title')}>{t('lead')}</AuthHeading>
      {error === 'session' && (
        <p role="alert" className="mb-6 text-sm text-danger">
          {t('sessionEnded')}
        </p>
      )}
      {error === 'oauth' && (
        <p role="alert" className="mb-6 text-sm text-danger">
          {t('googleFailed')}
        </p>
      )}
      <GoogleSignIn action={signInWithGoogle} />
      <CredentialsForm action={signIn} mode="sign-in" />
      <p className="mt-6 text-sm">
        <Link href="/forgot-password" className={authLink}>
          {t('forgotPassword')}
        </Link>
      </p>
      <AuthFootnote>
        {t('noAccount')}{' '}
        <Link href="/sign-up" className={authLink}>
          {t('signUp')}
        </Link>
      </AuthFootnote>
    </>
  )
}
