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

export const messages = {
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

export type Messages = typeof messages
