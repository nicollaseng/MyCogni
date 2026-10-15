import { auth as american } from '../en-US/auth'
import type { AuthMessages } from '../pt-BR/auth'

export const auth: AuthMessages = {
  ...american,
  meta: { ...american.meta, forgotPassword: 'Forgotten password' },
  signIn: { ...american.signIn, forgotPassword: 'Forgotten your password?' },
  forgotPassword: { ...american.forgotPassword, title: 'Forgotten your password?' },
}
