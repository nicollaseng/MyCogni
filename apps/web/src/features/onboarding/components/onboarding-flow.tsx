'use client'

import type { Assessment } from '@mycogni/contracts'
import { gad7, phq9 } from '@mycogni/domain'
import { useState } from 'react'
import {
  phaseOf,
  type OnboardingActions,
  type OnboardingStart,
  type Results,
  type Step,
} from '../model'
import { ConsentStep } from './consent-step'
import { NameStep } from './name-step'
import { OnboardingHeader } from './onboarding-header'
import { Questionnaire } from '@/features/screening/components/questionnaire'
import { ResultsStep } from './results-step'
import { ScreeningIntroStep } from './screening-intro-step'
import { SupportStep } from '@/features/screening/components/support-step'

interface OnboardingFlowProps {
  start: OnboardingStart
  actions: OnboardingActions
  signOut: () => Promise<void>
}

export function OnboardingFlow({ start, actions, signOut }: OnboardingFlowProps) {
  const [step, setStep] = useState<Step>(start.step)
  const [results, setResults] = useState<Results>(start.results)

  function record(assessment: Assessment, next: Step) {
    setResults((current) => ({ ...current, [assessment.instrument]: assessment }))
    setStep(next)
  }

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
                setStep('name')
              }}
            />
          )}
          {step === 'name' && (
            <NameStep
              initialName={start.displayName}
              save={actions.saveName}
              onDone={() => {
                setStep('intro')
              }}
            />
          )}
          {step === 'intro' && (
            <ScreeningIntroStep
              onStart={() => {
                setStep('phq9')
              }}
            />
          )}
          {step === 'phq9' && (
            <Questionnaire
              instrument={phq9}
              send={actions.submitScreening}
              onDone={(assessment) => {
                record(assessment, assessment.hasRiskFlag ? 'support' : 'gad7')
              }}
            />
          )}
          {step === 'support' && (
            <SupportStep
              onContinue={() => {
                setStep('gad7')
              }}
            />
          )}
          {step === 'gad7' && (
            <Questionnaire
              instrument={gad7}
              send={actions.submitScreening}
              onDone={(assessment) => {
                record(assessment, 'results')
              }}
            />
          )}
          {step === 'results' && results.phq9 !== undefined && results.gad7 !== undefined && (
            <ResultsStep
              depression={results.phq9}
              anxiety={results.gad7}
              finish={actions.finishOnboarding}
            />
          )}
        </main>
      </div>
    </div>
  )
}
