'use server'

import type { DataExport } from '@mycogni/contracts'
import { getTranslations } from 'next-intl/server'
import { z } from 'zod'
import { failure, type ActionResult } from '@/shared/lib/actions/result'
import { ApiError } from '@/shared/lib/api/client'
import { exportDownloadUrl, fetchLatestExport, requestExport } from '@/shared/lib/api/exports'

const exportId = z.uuid()

async function problemOf(cause: unknown): Promise<string> {
  const t = await getTranslations('exports')
  if (cause instanceof ApiError && cause.status === 429) {
    return t('limit')
  }
  console.error(cause)
  return t('error')
}

export async function prepareDataExport(): Promise<ActionResult<DataExport>> {
  try {
    return { ok: true, value: await requestExport() }
  } catch (cause) {
    return failure(await problemOf(cause))
  }
}

export async function latestDataExport(): Promise<DataExport | null> {
  try {
    return await fetchLatestExport()
  } catch {
    return null
  }
}

export async function downloadDataExport(id: string): Promise<ActionResult<string>> {
  if (!exportId.safeParse(id).success) {
    return failure((await getTranslations('exports'))('error'))
  }
  try {
    return { ok: true, value: await exportDownloadUrl(id) }
  } catch (cause) {
    return failure(await problemOf(cause))
  }
}
