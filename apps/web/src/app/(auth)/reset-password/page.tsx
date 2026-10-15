import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { resetPassword } from '@/features/auth/actions'
import { AuthFootnote, authLink } from '@/features/auth/components/auth-footnote'
import { AuthHeading } from '@/features/auth/components/auth-heading'
import { CodeForm } from '@/features/auth/components/code-form'
import { pendingEmail } from '@/features/auth/pending-email'

export const metadata: Metadata = { title: 'Nova senha' }

export default async function ResetPasswordPage() {
  const email = await pendingEmail()
  if (email === null) {
    redirect('/forgot-password')
  }

  return (
    <>
      <AuthHeading title="Crie uma nova senha">
        Digite o código que enviamos para <span className="text-foreground">{email}</span> e escolha
        a nova senha.
      </AuthHeading>
      <CodeForm action={resetPassword} withNewPassword submitLabel="Salvar nova senha" />
      <AuthFootnote>
        Não recebeu?{' '}
        <Link href="/forgot-password" className={authLink}>
          Enviar outro código
        </Link>
      </AuthFootnote>
    </>
  )
}
