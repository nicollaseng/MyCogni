import type { Metadata } from 'next'
import Link from 'next/link'
import { requestPasswordReset } from '@/features/auth/actions'
import { AuthFootnote, authLink } from '@/features/auth/components/auth-footnote'
import { AuthHeading } from '@/features/auth/components/auth-heading'
import { EmailForm } from '@/features/auth/components/email-form'

export const metadata: Metadata = { title: 'Esqueci a senha' }

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthHeading title="Esqueceu a senha?">
        Digite seu email. Se houver uma conta, enviamos um código para você criar uma nova senha.
      </AuthHeading>
      <EmailForm action={requestPasswordReset} submitLabel="Enviar código" />
      <AuthFootnote>
        Lembrou?{' '}
        <Link href="/sign-in" className={authLink}>
          Entrar
        </Link>
      </AuthFootnote>
    </>
  )
}
