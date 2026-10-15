import { zenArticles, type ContentLanguage, type StepText, type TrackStep } from '@mycogni/domain'

export function stepTitle(step: TrackStep, text: StepText, language: ContentLanguage): string {
  return step.kind === 'read' ? zenArticles[step.article].text[language].title : text.title
}
