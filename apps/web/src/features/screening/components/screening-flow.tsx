'use client'

import type { Assessment } from '@mycogni/contracts'
import {
  answerQuestion,
  fullFormStart,
  isScreeningComplete,
  nextQuestion,
  previousQuestion,
  progressAt,
  recordsToSave,
  screeningQuestions,
  type Answer,
  type ScreeningDomain,
  type ScreeningQuestion,
  type ScreeningSession,
} from '@mycogni/domain'
import { useEffect, useRef, useState } from 'react'
import { useIsClient } from '@/shared/hooks/use-is-client'
import { forgetScreeningDraft, readScreeningDraft, writeScreeningDraft } from '../draft'
import type { LatestResults } from '../latest'
import type { ScreeningResults, SubmitScreening } from '../model'
import { startedSession, type SessionScope } from '../session'
import { MoreQuestions } from './more-questions'
import { QuestionStep } from './question-step'
import { SupportStep } from './support-step'

const advanceDelay = 220

interface ScreeningFlowProps {
  userId: string
  scope: SessionScope
  assessments: readonly Assessment[]
  send: SubmitScreening
  onComplete: (results: ScreeningResults) => void
}

interface Progress {
  session: ScreeningSession
  saved: LatestResults
  flagged: boolean
}

function followingQuestion(
  session: ScreeningSession,
  from: ScreeningQuestion,
): ScreeningQuestion | null {
  const questions = screeningQuestions(session)
  const index = questions.findIndex(
    (question) => question.domain === from.domain && question.item === from.item,
  )
  return questions[index + 1] ?? nextQuestion(session)
}

function completeResults(saved: LatestResults): ScreeningResults | null {
  const { depression, anxiety } = saved
  return depression === undefined || anxiety === undefined ? null : { depression, anxiety }
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds)
  })
}

function ScreeningSteps({ userId, scope, assessments, send, onComplete }: ScreeningFlowProps) {
  const [start] = useState(() => startedSession(scope, assessments, readScreeningDraft(userId)))
  const [session, setSession] = useState(start.session)
  const [saved, setSaved] = useState<LatestResults>(start.saved)
  const [current, setCurrent] = useState(() => nextQuestion(start.session))
  const [announced, setAnnounced] = useState<readonly ScreeningDomain[]>([])
  const [support, setSupport] = useState(false)
  const [busy, setBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const finished = useRef(false)

  function persist(next: ScreeningSession, results: LatestResults) {
    writeScreeningDraft(userId, {
      updatedAt: Date.now(),
      answers: next.answers,
      saved: { depression: results.depression?.id, anxiety: results.anxiety?.id },
    })
  }

  function finish(results: LatestResults) {
    const complete = completeResults(results)
    if (complete === null || finished.current) {
      return
    }
    finished.current = true
    forgetScreeningDraft(userId)
    onComplete(complete)
  }

  useEffect(() => {
    if (isScreeningComplete(start.session)) {
      finish(start.saved)
    }
  })

  async function saveRecords(
    next: ScreeningSession,
    results: LatestResults,
  ): Promise<Progress | null> {
    let progress: Progress = { session: next, saved: results, flagged: false }
    for (const record of recordsToSave(next)) {
      const outcome = await send({ instrument: record.instrument, answers: record.answers })
      if (!outcome.ok) {
        setError(outcome.error)
        return null
      }
      progress = {
        session: {
          ...progress.session,
          saved: { ...progress.session.saved, [record.domain]: record.instrument },
        },
        saved: { ...progress.saved, [record.domain]: outcome.value },
        flagged: progress.flagged || outcome.value.hasRiskFlag,
      }
      setSession(progress.session)
      setSaved(progress.saved)
      persist(progress.session, progress.saved)
    }
    return progress
  }

  function moveOn(progress: Progress, from: ScreeningQuestion) {
    if (progress.flagged) {
      setSupport(true)
    }
    if (isScreeningComplete(progress.session)) {
      setCurrent(null)
      if (!progress.flagged) {
        finish(progress.saved)
      }
      return
    }
    setCurrent(followingQuestion(progress.session, from))
  }

  async function advance(next: ScreeningSession, from: ScreeningQuestion) {
    setBusy(true)
    setError(null)
    let progress: Progress | null = { session: next, saved, flagged: false }
    if (recordsToSave(next).length > 0) {
      setSaving(true)
      progress = await saveRecords(next, saved)
      setSaving(false)
    } else {
      await wait(advanceDelay)
    }
    setBusy(false)
    if (progress !== null) {
      moveOn(progress, from)
    }
  }

  function choose(value: Answer) {
    if (current === null || busy) {
      return
    }
    const next = answerQuestion(session, current, value)
    setSession(next)
    persist(next, saved)
    void advance(next, current)
  }

  if (support) {
    return (
      <SupportStep
        onContinue={() => {
          setSupport(false)
          if (isScreeningComplete(session)) {
            finish(saved)
          }
        }}
      />
    )
  }

  if (current === null) {
    return <section aria-busy="true" className="flex min-h-0 flex-1 flex-col" />
  }

  const opening = fullFormStart(current)
  if (opening !== null && !announced.includes(opening.domain)) {
    return (
      <MoreQuestions
        start={opening}
        onContinue={() => {
          setAnnounced([...announced, opening.domain])
        }}
      />
    )
  }

  const previous = previousQuestion(session, current)

  return (
    <QuestionStep
      question={current}
      progress={progressAt(session, current)}
      selected={session.answers[current.domain][current.item]}
      saving={saving}
      error={error}
      onChoose={choose}
      onBack={
        previous === null || busy
          ? null
          : () => {
              setCurrent(previous)
            }
      }
      onRetry={() => {
        void advance(session, current)
      }}
    />
  )
}

export function ScreeningFlow(props: ScreeningFlowProps) {
  const client = useIsClient()
  if (!client) {
    return <section aria-busy="true" className="flex min-h-0 flex-1 flex-col" />
  }
  return <ScreeningSteps {...props} />
}
