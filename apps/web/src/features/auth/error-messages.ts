import type { AuthMessages } from '@/i18n/messages/pt-BR/auth'

export type AuthErrorKey = keyof AuthMessages['errors']

const keysByCode: Readonly<Record<string, AuthErrorKey>> = {
  invalid_credentials: 'invalidCredentials',
  email_not_confirmed: 'emailNotConfirmed',
  user_already_exists: 'accountExists',
  email_exists: 'accountExists',
  weak_password: 'weakPassword',
  otp_expired: 'codeExpired',
  same_password: 'samePassword',
  over_email_send_rate_limit: 'tooManyEmails',
  over_request_rate_limit: 'tooManyRequests',
}

export function authErrorKey(code: string | undefined): AuthErrorKey {
  return (code === undefined ? undefined : keysByCode[code]) ?? 'generic'
}
