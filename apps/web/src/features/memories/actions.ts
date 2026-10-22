'use server'

import type { Memory } from '@mycogni/contracts'
import { isMemoryContent, memoryLimits, normalizeMemory } from '@mycogni/domain'
import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { z } from 'zod'
import { attempt, failure, type ActionResult } from '@/shared/lib/actions/result'
import {
  createMemory,
  deleteAllMemories,
  deleteMemory,
  updateMemory,
} from '@/shared/lib/api/memories'
import { updateProfile } from '@/shared/lib/api/resources'

const memoryId = z.uuid()

async function feedback() {
  return getTranslations('memories.feedback')
}

async function contentProblem(content: string): Promise<string | null> {
  if (isMemoryContent(content)) {
    return null
  }
  const t = await feedback()
  return normalizeMemory(content) === '' ? t('empty') : t('tooLong', { max: memoryLimits.content })
}

function refresh(): void {
  revalidatePath('/me', 'layout')
}

export async function addMemory(content: string): Promise<ActionResult<Memory>> {
  const problem = await contentProblem(content)
  if (problem !== null) {
    return failure(problem)
  }
  const result = await attempt(() => createMemory({ content }), (await feedback())('error'))
  if (result.ok) {
    refresh()
  }
  return result
}

export async function editMemory(id: string, content: string): Promise<ActionResult<Memory>> {
  const problem = await contentProblem(content)
  if (problem !== null) {
    return failure(problem)
  }
  const t = await feedback()
  if (!memoryId.safeParse(id).success) {
    return failure(t('error'))
  }
  const result = await attempt(() => updateMemory(id, { content }), t('error'))
  if (result.ok) {
    refresh()
  }
  return result
}

export async function removeMemory(id: string): Promise<ActionResult<null>> {
  const t = await feedback()
  if (!memoryId.safeParse(id).success) {
    return failure(t('error'))
  }
  const result = await attempt(async () => {
    await deleteMemory(id)
    return null
  }, t('error'))
  if (result.ok) {
    refresh()
  }
  return result
}

export async function clearMemories(): Promise<ActionResult<null>> {
  const result = await attempt(
    async () => {
      await deleteAllMemories()
      return null
    },
    (await feedback())('error'),
  )
  if (result.ok) {
    refresh()
  }
  return result
}

export async function setMemoriesEnabled(enabled: boolean): Promise<ActionResult<string>> {
  const t = await feedback()
  const result = await attempt(async () => {
    await updateProfile({ memoriesEnabled: enabled })
    return enabled ? t('on') : t('off')
  }, t('error'))
  if (result.ok) {
    refresh()
  }
  return result
}
