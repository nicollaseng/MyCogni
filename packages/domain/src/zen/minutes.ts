import { tracks, type StepKind, type TrackId, type TrackStep } from './catalog.ts'
import { articles } from './content/articles/articles.ts'
import type { ContentLanguage } from './content/types.ts'
import { readingMinutes } from './reading.ts'

const minutesByKind: Readonly<Record<Exclude<StepKind, 'read'>, number>> = {
  breathe: 1,
  write: 5,
  check_in: 1,
  reflect: 2,
  questionnaire: 3,
  support: 2,
}

export function stepMinutes(step: TrackStep, language: ContentLanguage): number {
  return step.kind === 'read'
    ? readingMinutes(articles[step.article].text[language])
    : minutesByKind[step.kind]
}

export function trackMinutes(trackId: TrackId, language: ContentLanguage): number {
  return tracks[trackId].steps.reduce((total, step) => total + stepMinutes(step, language), 0)
}
