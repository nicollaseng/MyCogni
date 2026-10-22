import { account } from './account'
import { alerts } from './alerts'
import { assistant } from './assistant'
import { admin } from './admin'
import { audio } from './audio'
import { auth } from './auth'
import { care } from './care'
import { checkIn } from './check-in'
import { common } from './common'
import { entries } from './entries'
import { insights } from './insights'
import { landing } from './landing'
import { legal } from './legal'
import { memories } from './memories'
import { mybook } from './mybook'
import { onboarding } from './onboarding'
import { patterns } from './patterns'
import { professional } from './professional'
import { report } from './report'
import { safety } from './safety'
import { screening } from './screening'
import { support } from './support'
import { today } from './today'
import { verification } from './verification'
import { zen } from './zen'

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
  zen,
  audio,
  support,
  assistant,
  safety,
  memories,
}

export type Messages = typeof messages
