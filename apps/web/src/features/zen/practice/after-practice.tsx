'use client'

import { useState } from 'react'
import {
  ReminderOffer,
  useReminderOfferAvailable,
} from '@/features/reminders/components/reminder-offer'
import { FeelingPrompt } from './feeling-prompt'
import type { RememberFeeling } from './record'

interface AfterPracticeProps {
  question: string
  sessionId: string | null | undefined
  remember: RememberFeeling
  offer: boolean
}

export function AfterPractice({ question, sessionId, remember, offer }: AfterPracticeProps) {
  const offerAvailable = useReminderOfferAvailable() && offer
  const [step, setStep] = useState<'feeling' | 'offer'>('feeling')

  if (sessionId === undefined) {
    return (
      <p className="max-w-[22rem] text-center text-[15px] leading-relaxed text-pretty text-zen-foreground/85">
        {question}
      </p>
    )
  }
  if (step === 'feeling' && sessionId !== null) {
    return (
      <FeelingPrompt
        question={question}
        onFeel={async (level) => {
          const saved = await remember(sessionId, level)
          if (offerAvailable) {
            setStep('offer')
          }
          return saved
        }}
        onSkip={() => {
          setStep('offer')
        }}
      />
    )
  }
  return offer ? <ReminderOffer /> : null
}
