import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { changePassword, deleteMyAccount } from '@/features/account/actions'
import { DeleteAccount } from '@/features/account/components/delete-account'
import { PasswordForm } from '@/features/account/components/password-form'
import { SettingsPage } from '@/features/account/components/settings-page'
import { SettingsRow } from '@/features/account/components/settings-row'
import { signOut } from '@/features/auth/actions'
import { Panel } from '@/shared/components/section'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'
import { guarded } from '@/shared/lib/settled'
import { Button } from '@/shared/ui/button'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('account.nav')
  return { title: t('account') }
}

export default async function AccountPage() {
  const [, t] = await guarded(requireOnboardedProfile(), getTranslations('account'))

  return (
    <SettingsPage title={t('nav.account')}>
      <Panel>
        <SettingsRow label={t('password.label')} value="••••••••">
          <PasswordForm changePassword={changePassword} />
        </SettingsRow>
      </Panel>
      <form action={signOut}>
        <Button type="submit" variant="outline">
          {t('signOut')}
        </Button>
      </form>
      <Panel>
        <DeleteAccount remove={deleteMyAccount} />
      </Panel>
    </SettingsPage>
  )
}
