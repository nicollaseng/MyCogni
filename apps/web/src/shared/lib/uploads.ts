import type { UploadProblem } from '@mycogni/domain'

export type UploadFailure = UploadProblem | 'failed'

export type UploadResult<T> = { ok: true; value: T } | { ok: false; problem: UploadFailure }

const problems: Readonly<Partial<Record<number, UploadProblem>>> = { 413: 'size', 415: 'type' }

export async function sendUpload(url: string, init: RequestInit): Promise<UploadResult<unknown>> {
  try {
    const response = await fetch(url, init)
    if (!response.ok) {
      return { ok: false, problem: problems[response.status] ?? 'failed' }
    }
    return { ok: true, value: response.status === 204 ? null : await response.json() }
  } catch {
    return { ok: false, problem: 'failed' }
  }
}
