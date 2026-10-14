import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { resendCode, verifyEmail } from '@/features/auth/actions'
import { AuthFootnote, authLink } from '@/features/auth/components/auth-footnote'
import { AuthHeading } from '@/features/auth/components/auth-heading'
import { CodeForm } from '@/features/auth/components/code-form'
import { SingleActionButton } from '@/features/auth/components/single-action-button'
import { pendingEmail } from '@/features/auth/pending-email'

export const metadata: Metadata = { title: 'Confirme seu email' }

export default async function VerifyPage() {
  const email = await pendingEmail()
  if (email === null) {
    redirect('/sign-up')
  }

  return (
    <>
      <AuthHeading title="Confira seu email">
        Enviamos um código de 6 números para <span className="text-foreground">{email}</span>. Ele
        vale por 1 hora.
      </AuthHeading>
      <CodeForm action={verifyEmail} submitLabel="Confirmar email" />
      <div className="mt-4">
        <SingleActionButton action={resendCode} pendingLabel="Reenviando…" variant="ghost">
          Reenviar código
        </SingleActionButton>
      </div>
      <AuthFootnote>
        Email errado?{' '}
        <Link href="/sign-up" className={authLink}>
          Usar outro email
        </Link>
      </AuthFootnote>
    </>
  )
}
