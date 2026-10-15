import type { Metadata } from 'next'
import Link from 'next/link'
import { signOut } from '@/features/auth/actions'
import {
  changeEmail,
  changePassword,
  deleteMyAccount,
  removeAvatar,
  renameMe,
  setAiConsent,
  uploadAvatar,
} from '@/features/account/actions'
import { avatarUrl } from '@/features/account/avatar-url'
import { ConsentList } from '@/features/account/components/consent-list'
import { DeleteAccount } from '@/features/account/components/delete-account'
import { EmailForm } from '@/features/account/components/email-form'
import { NameForm } from '@/features/account/components/name-form'
import { PasswordForm } from '@/features/account/components/password-form'
import { ProfileHeader } from '@/features/account/components/profile-header'
import { SettingsRow } from '@/features/account/components/settings-row'
import { LatestScreening } from '@/features/screening/components/latest-screening'
import { ScreeningHistory } from '@/features/screening/components/screening-history'
import { screeningIntervalDays } from '@/features/screening/due'
import { latestByInstrument } from '@/features/screening/latest'
import { Panel, Section } from '@/shared/components/section'
import { fetchAssessments, fetchConsents } from '@/shared/lib/api/resources'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'
import { Button } from '@/shared/ui/button'

export const metadata: Metadata = { title: 'Você' }

const rowLink = 'block py-3.5 underline decoration-1 underline-offset-4'

export default async function MePage() {
  const profile = await requireOnboardedProfile()
  const [assessments, consents, photoUrl] = await Promise.all([
    fetchAssessments(),
    fetchConsents(),
    avatarUrl(profile.avatarPath),
  ])

  return (
    <div className="space-y-12">
      <ProfileHeader
        name={profile.displayName}
        email={profile.email}
        photoUrl={photoUrl}
        upload={uploadAvatar}
        remove={removeAvatar}
      />

      <LatestScreening results={latestByInstrument(assessments)} timeZone={profile.timezone}>
        <ScreeningHistory assessments={assessments} timeZone={profile.timezone} />
        <div className="space-y-1 px-1">
          <Link href="/questionnaires" className="underline decoration-1 underline-offset-4">
            Refazer os questionários
          </Link>
          <p className="text-sm text-muted-foreground">
            Sugerimos a cada {screeningIntervalDays} dias, para ver como você muda.
          </p>
        </div>
      </LatestScreening>

      <Section title="Conta">
        <Panel>
          <SettingsRow label="Nome" value={profile.displayName ?? 'Sem nome'}>
            <NameForm initialName={profile.displayName ?? ''} rename={renameMe} />
          </SettingsRow>
          <SettingsRow label="Email" value={profile.email ?? ''}>
            <EmailForm changeEmail={changeEmail} />
          </SettingsRow>
          <SettingsRow label="Senha" value="••••••••">
            <PasswordForm changePassword={changePassword} />
          </SettingsRow>
        </Panel>
      </Section>

      <Section title="Privacidade">
        <Panel>
          <ConsentList
            consents={consents}
            timeZone={profile.timezone}
            setAiConsent={setAiConsent}
          />
        </Panel>
        <p className="px-1 text-sm text-pretty text-muted-foreground">
          Os consentimentos obrigatórios só podem ser retirados com a exclusão da conta, em Seus
          dados.
        </p>
      </Section>

      <Section title="Seus dados">
        <Panel>
          <a href="/me/export" download className={rowLink}>
            Baixar meus dados
          </a>
          <DeleteAccount remove={deleteMyAccount} />
        </Panel>
      </Section>

      <form action={signOut}>
        <Button type="submit" variant="outline" shape="pill">
          Sair
        </Button>
      </form>
    </div>
  )
}
