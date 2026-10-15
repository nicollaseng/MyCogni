import { useTranslations } from 'next-intl'
import { AuthHeading } from './auth-heading'

type IntroSection = 'verify' | 'forgotPassword' | 'resetPassword' | 'newPassword'

interface AuthIntroProps {
  section: IntroSection
  email?: string
}

export function AuthIntro({ section, email = '' }: AuthIntroProps) {
  const t = useTranslations('auth')

  return (
    <AuthHeading title={t(`${section}.title`)}>
      {t.rich(`${section}.lead`, {
        email,
        highlight: (chunks) => <span className="text-foreground">{chunks}</span>,
      })}
    </AuthHeading>
  )
}
