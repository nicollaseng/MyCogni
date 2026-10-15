import { account } from './account'
import { alerts } from './alerts'
import { admin } from './admin'
import { auth } from './auth'
import { care } from './care'
import { checkIn } from './check-in'
import { common } from './common'
import { entries } from './entries'
import { insights } from './insights'
import { landing } from './landing'
import { legal } from './legal'
import { mybook } from './mybook'
import { onboarding } from './onboarding'
import { patterns } from './patterns'
import { professional } from './professional'
import { report } from './report'
import { screening } from './screening'
import { support } from './support'
import { today } from './today'
import { verification } from './verification'

export const messages = {
  common,
  landing,
  legal,
  auth,
  onboarding,
  checkIn,
  entries,
  mybook,
  today,
  patterns,
  insights,
  report,
  screening,
  account,
  care,
  professional,
  alerts,
  admin,
  verification,
  support,
}

export type Messages = typeof messages
