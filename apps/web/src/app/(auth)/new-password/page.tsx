import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { setNewPassword } from '@/features/auth/actions'
import { AuthIntro } from '@/features/auth/components/auth-intro'
import { NewPasswordForm } from '@/features/auth/components/new-password-form'
import { currentUser } from '@/shared/lib/auth/session'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.meta')
  return { title: t('newPassword') }
}

export default async function NewPasswordPage() {
  if ((await currentUser()) === null) {
    redirect('/forgot-password')
  }
  const t = await getTranslations('auth.newPassword')

  return (
    <>
      <AuthIntro section="newPassword" />
      <NewPasswordForm action={setNewPassword} submitLabel={t('submit')} />
    </>
  )
}
