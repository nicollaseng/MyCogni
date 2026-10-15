import type { Metadata } from 'next'
import Link from 'next/link'
import { signUp } from '@/features/auth/actions'
import { AuthFootnote, authLink } from '@/features/auth/components/auth-footnote'
import { AuthHeading } from '@/features/auth/components/auth-heading'
import { CredentialsForm } from '@/features/auth/components/credentials-form'
import { GoogleSignIn } from '@/features/auth/components/google-sign-in'
import { redirectSignedInUser } from '@/shared/lib/auth/session'
import { publicEnv } from '@/shared/lib/env'

export const metadata: Metadata = { title: 'Criar conta' }

export default async function SignUpPage() {
  await redirectSignedInUser()

  return (
    <>
      <AuthHeading title="Criar conta">
        Leva um minuto. Depois, duas avaliações curtas para entender como você está.
      </AuthHeading>
      {publicEnv().googleAuthEnabled && <GoogleSignIn />}
      <CredentialsForm action={signUp} mode="sign-up" />
      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        Ao criar a conta, você concorda com os{' '}
        <Link href="/terms" className={authLink}>
          Termos de uso
        </Link>{' '}
        e com a{' '}
        <Link href="/privacy" className={authLink}>
          Política de privacidade
        </Link>
        .
      </p>
      <AuthFootnote>
        Já tem conta?{' '}
        <Link href="/sign-in" className={authLink}>
          Entrar
        </Link>
      </AuthFootnote>
    </>
  )
}
