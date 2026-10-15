import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { signUp, signInWithGoogle } from '@/features/auth/actions'
import { AuthFootnote, authLink } from '@/features/auth/components/auth-footnote'
import { AuthHeading } from '@/features/auth/components/auth-heading'
import { CredentialsForm } from '@/features/auth/components/credentials-form'
import { GoogleSignIn } from '@/features/auth/components/google-sign-in'
import { redirectSignedInUser } from '@/shared/lib/auth/session'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.meta')
  return { title: t('signUp') }
}

export default async function SignUpPage() {
  await redirectSignedInUser()
  const t = await getTranslations('auth.signUp')

  return (
    <>
      <AuthHeading title={t('title')}>{t('lead')}</AuthHeading>
      <GoogleSignIn action={signInWithGoogle} />
      <CredentialsForm action={signUp} mode="sign-up" />
      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        {t.rich('agreement', {
          terms: (chunks) => (
            <Link href="/terms" className={authLink}>
              {chunks}
            </Link>
          ),
          privacy: (chunks) => (
            <Link href="/privacy" className={authLink}>
              {chunks}
            </Link>
          ),
        })}
      </p>
      <AuthFootnote>
        {t('hasAccount')}{' '}
        <Link href="/sign-in" className={authLink}>
          {t('signIn')}
        </Link>
      </AuthFootnote>
    </>
  )
}
