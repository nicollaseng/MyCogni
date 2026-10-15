import type { SupportSignal } from '@mycogni/contracts'
import { needsSupport, raisesNoteAlert, type RiskLevel } from '@mycogni/domain'
import type { FastifyBaseLogger } from 'fastify'
import type { SavedNote } from '../../jobs/alert-trigger.ts'
import type { JobScheduler } from '../../jobs/scheduler.ts'

export interface NoteSafety {
  review(note: SavedNote, level: RiskLevel): Promise<SupportSignal>
}

export function createNoteSafety(
  jobs: Pick<JobScheduler, 'noteSaved'>,
  log: Pick<FastifyBaseLogger, 'info'>,
): NoteSafety {
  return {
    async review(note, level) {
      if (needsSupport(level)) {
        log.info({ ...note, support: level }, 'Note support signal')
      }
      if (raisesNoteAlert(level)) {
        await jobs.noteSaved(note)
      }
      return { level }
    },
  }
}
