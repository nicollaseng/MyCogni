import type { Metadata } from 'next'
import Link from 'next/link'
import { signIn } from '@/features/auth/actions'
import { AuthFootnote, authLink } from '@/features/auth/components/auth-footnote'
import { AuthHeading } from '@/features/auth/components/auth-heading'
import { CredentialsForm } from '@/features/auth/components/credentials-form'
import { GoogleSignIn } from '@/features/auth/components/google-sign-in'
import { redirectSignedInUser } from '@/shared/lib/auth/session'
import { publicEnv } from '@/shared/lib/env'

export const metadata: Metadata = { title: 'Entrar' }

export default async function SignInPage({ searchParams }: PageProps<'/sign-in'>) {
  await redirectSignedInUser()
  const { error } = await searchParams

  return (
    <>
      <AuthHeading title="Entrar">Que bom ter você de volta.</AuthHeading>
      {error === 'session' && (
        <p role="alert" className="mb-6 text-sm text-danger">
          Sua sessão terminou. Entre de novo para continuar.
        </p>
      )}
      {error === 'oauth' && (
        <p role="alert" className="mb-6 text-sm text-danger">
          Não foi possível entrar com o Google. Tente de novo.
        </p>
      )}
      {publicEnv().googleAuthEnabled && <GoogleSignIn />}
      <CredentialsForm action={signIn} mode="sign-in" />
      <p className="mt-6 text-sm">
        <Link href="/forgot-password" className={authLink}>
          Esqueci a senha
        </Link>
      </p>
      <AuthFootnote>
        Ainda não tem conta?{' '}
        <Link href="/sign-up" className={authLink}>
          Criar conta
        </Link>
      </AuthFootnote>
    </>
  )
}
