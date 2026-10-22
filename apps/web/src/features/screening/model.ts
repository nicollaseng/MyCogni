import type { Assessment } from '@mycogni/contracts'
import type { InstrumentId, ScreeningDomain } from '@mycogni/domain'
import type { ActionResult } from '@/shared/lib/actions/result'

export interface ScreeningInput {
  instrument: InstrumentId
  answers: number[]
}

export type SubmitScreening = (input: ScreeningInput) => Promise<ActionResult<Assessment>>

export type ScreeningResults = Readonly<Record<ScreeningDomain, Assessment>>
