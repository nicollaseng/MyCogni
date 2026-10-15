import { useTranslations } from 'next-intl'
import type { FormState } from '../form-state'
import { GoogleMark } from './google-mark'
import { SingleActionButton } from './single-action-button'

interface GoogleSignInProps {
  action: (state: FormState) => Promise<FormState>
}

export function GoogleSignIn({ action }: GoogleSignInProps) {
  const t = useTranslations('auth.google')

  return (
    <div className="mb-6 space-y-6">
      <SingleActionButton action={action} pendingLabel={t('opening')}>
        <span className="flex items-center gap-3">
          <GoogleMark />
          {t('continue')}
        </span>
      </SingleActionButton>
      <p className="flex items-center gap-4 text-sm text-muted-foreground before:h-px before:flex-1 before:bg-rule after:h-px after:flex-1 after:bg-rule">
        {t('divider')}
      </p>
    </div>
  )
}
