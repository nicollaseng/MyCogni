import { useTranslations } from 'next-intl'

const messageKeys = {
  session: 'sessionEnded',
  oauth: 'googleFailed',
  link: 'linkFailed',
} as const

type SignInError = keyof typeof messageKeys

function isSignInError(value: unknown): value is SignInError {
  return typeof value === 'string' && Object.hasOwn(messageKeys, value)
}

export function SignInAlert({ error }: { error: string | string[] | undefined }) {
  const t = useTranslations('auth.signIn')
  if (!isSignInError(error)) {
    return null
  }
  return (
    <p role="alert" className="mb-6 text-sm text-danger">
      {t(messageKeys[error])}
    </p>
  )
}
