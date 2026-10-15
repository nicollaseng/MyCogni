import {
  zenArticles,
  type ContentLanguage,
  type StepText,
  type TrackProgress,
  type TrackStep,
} from '@mycogni/domain'
import type { TrackStatus } from './components/status-dot'

export function trackStatusOf({ started, complete }: TrackProgress): TrackStatus {
  if (complete) {
    return 'complete'
  }
  return started ? 'started' : 'new'
}

export function hasStepAction(step: TrackStep): boolean {
  return step.kind !== 'reflect' && step.kind !== 'support'
}

export function stepTitle(step: TrackStep, text: StepText, language: ContentLanguage): string {
  return step.kind === 'read' ? zenArticles[step.article].text[language].title : text.title
}
