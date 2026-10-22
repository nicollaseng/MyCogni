import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import {
  beginQuestionnaire,
  finishQuestionnaire,
  saveAnswer,
} from '@/features/questionnaires/actions'
import { RunFlow } from '@/features/questionnaires/components/run-flow'
import { ApiError } from '@/shared/lib/api/client'
import { fetchQuestionnaireRun } from '@/shared/lib/api/questionnaires'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('questionnaires.meta')
  return { title: t('title') }
}

async function runOrNothing(id: string) {
  try {
    return await fetchQuestionnaireRun(id)
  } catch (cause) {
    if (cause instanceof ApiError && (cause.status === 404 || cause.status === 400)) {
      return null
    }
    throw cause
  }
}

export default async function AssignedQuestionnairePage({
  params,
}: PageProps<'/questionnaires/[id]'>) {
  const { id } = await params
  await requireOnboardedProfile()
  const run = await runOrNothing(id)
  if (run === null) {
    notFound()
  }
  return (
    <RunFlow
      initial={run}
      actions={{ begin: beginQuestionnaire, save: saveAnswer, finish: finishQuestionnaire }}
    />
  )
}
