import { account } from './account'
import { auth } from './auth'
import { checkIn } from './check-in'
import { common } from './common'
import { entries } from './entries'
import { landing } from './landing'
import { legal } from './legal'
import { onboarding } from './onboarding'
import { patterns } from './patterns'
import { screening } from './screening'
import { today } from './today'
import type { Messages } from '../pt-BR'

export const messages: Messages = {
  common,
  landing,
  legal,
  auth,
  onboarding,
  checkIn,
  entries,
  today,
  patterns,
  screening,
  account,
}
