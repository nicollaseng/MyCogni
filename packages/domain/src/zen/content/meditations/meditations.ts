import type { MeditationId } from '../../meditation-ids.ts'
import { anxietyMeditation } from './anxiety.ts'
import { focusMeditation } from './focus.ts'
import { griefMeditation } from './grief.ts'
import { heavyDaysMeditation } from './heavy-days.ts'
import { innerPeaceMeditation } from './inner-peace.ts'
import type { Meditation } from './types.ts'

export const meditations: Readonly<Record<MeditationId, Meditation>> = {
  anxiety: anxietyMeditation,
  'heavy-days': heavyDaysMeditation,
  grief: griefMeditation,
  focus: focusMeditation,
  'inner-peace': innerPeaceMeditation,
}
