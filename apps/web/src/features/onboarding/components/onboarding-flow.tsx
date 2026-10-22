'use client'

import { useState, useSyncExternalStore } from 'react'
import type { PhotoTransport } from '@/features/account/components/photo-field'
import { ScreeningFlow } from '@/features/screening/components/screening-flow'
import { hasScreeningDraft } from '@/features/screening/draft'
import type { ScreeningResults } from '@/features/screening/model'
import { phaseOf, type OnboardingActions, type OnboardingStart, type Step } from '../model'
import { ConsentStep } from './consent-step'
import { NameStep } from './name-step'
import { OnboardingHeader } from './onboarding-header'
import { PhotoStep, type OnboardingPhoto } from './photo-step'
import { ResultsStep } from './results-step'
import { ScreeningIntroStep } from './screening-intro-step'

interface OnboardingFlowProps {
  start: OnboardingStart
  actions: OnboardingActions
  photo: OnboardingPhoto
  photoTransport?: PhotoTransport
  signOut: () => Promise<void>
}

function subscribeToNothing(): () => void {
  return () => undefined
}

export function OnboardingFlow({
  start,
  actions,
  photo,
  photoTransport,
  signOut,
}: OnboardingFlowProps) {
  const resumable = useSyncExternalStore(
    subscribeToNothing,
    () => hasScreeningDraft(start.userId),
    () => false,
  )
  const [chosen, setChosen] = useState<Step | null>(null)
  const [results, setResults] = useState<ScreeningResults | null>(() => {
    const { depression, anxiety } = start.results
    return depression === undefined || anxiety === undefined ? null : { depression, anxiety }
  })
  const [name, setName] = useState(start.displayName)
  const step = chosen ?? (resumable && start.step === 'name' ? 'screening' : start.step)

  return (
    <div className="flex h-dvh flex-col">
      <div className="mx-auto flex min-h-0 w-full max-w-[460px] flex-1 flex-col px-6 pt-5">
        <OnboardingHeader phase={phaseOf(step)} signOut={signOut} />
        <main
          key={step}
          className="flex min-h-0 flex-1 animate-rise flex-col motion-reduce:animate-none"
        >
          {step === 'consents' && (
            <ConsentStep
              accept={actions.acceptConsents}
              onDone={() => {
                setChosen('name')
              }}
            />
          )}
          {step === 'name' && (
            <NameStep
              initialName={start.displayName}
              save={actions.saveName}
              onDone={(displayName) => {
                setName(displayName)
                setChosen('photo')
              }}
            />
          )}
          {step === 'photo' && (
            <PhotoStep
              photo={photo}
              name={name}
              saved={actions.photoSaved}
              transport={photoTransport}
              onDone={() => {
                setChosen('intro')
              }}
            />
          )}
          {step === 'intro' && (
            <ScreeningIntroStep
              onStart={() => {
                setChosen('screening')
              }}
            />
          )}
          {step === 'screening' && (
            <ScreeningFlow
              userId={start.userId}
              scope="onboarding"
              assessments={start.assessments}
              send={actions.submitScreening}
              onComplete={(done) => {
                setResults(done)
                setChosen('results')
              }}
            />
          )}
          {step === 'results' && results !== null && (
            <ResultsStep
              depression={results.depression}
              anxiety={results.anxiety}
              finish={actions.finishOnboarding}
            />
          )}
        </main>
      </div>
    </div>
  )
}
