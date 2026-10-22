import type { ProfessionalProfile } from '@mycogni/contracts'

export const onboardingSteps = ['document', 'photo', 'review'] as const

export type OnboardingStep = (typeof onboardingSteps)[number]

export const photoStepFlag = 'pro_photo_step_done'

export function photoStepDoneIn(metadata: Readonly<Record<string, unknown>> | undefined): boolean {
  return metadata?.[photoStepFlag] === true
}

export function onboardingStepOf(
  professional: Pick<ProfessionalProfile, 'status' | 'document'>,
  photo: { added: boolean; confirmed: boolean },
): OnboardingStep {
  if (professional.status === 'rejected' || professional.document === null) {
    return 'document'
  }
  return photo.added && photo.confirmed ? 'review' : 'photo'
}

export function stepNumberOf(step: OnboardingStep): number {
  return onboardingSteps.indexOf(step) + 1
}
