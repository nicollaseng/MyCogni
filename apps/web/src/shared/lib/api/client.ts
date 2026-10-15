import { z } from 'zod'
import { serverEnv } from '../env'
import { createSupabaseServerClient } from '../supabase/server'

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface ApiRequest<T> {
  path: `/v1/${string}`
  schema: z.ZodType<T>
  method?: Method
  body?: unknown
  anonymous?: boolean
}

const errorBodySchema = z.object({ code: z.string(), message: z.string() })

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

function errorOf(status: number, payload: unknown): ApiError {
  const error = errorBodySchema.safeParse(payload)
  return error.success
    ? new ApiError(status, error.data.code, error.data.message)
    : new ApiError(status, 'UNKNOWN', `API answered ${String(status)}`)
}

async function accessToken(): Promise<string> {
  const supabase = await createSupabaseServerClient('read-only')
  const { data } = await supabase.auth.getSession()
  if (data.session === null) {
    throw new ApiError(401, 'UNAUTHORIZED', 'No session to call the API with')
  }
  return data.session.access_token
}

export async function apiRequest<T>({
  path,
  schema,
  method = 'GET',
  body,
  anonymous = false,
}: ApiRequest<T>): Promise<T> {
  const headers: Record<string, string> = anonymous
    ? {}
    : { authorization: `Bearer ${await accessToken()}` }
  if (body !== undefined) {
    headers['content-type'] = 'application/json'
  }
  const response = await fetch(`${serverEnv().apiUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  })
  const payload: unknown = response.status === 204 ? null : await response.json()
  if (!response.ok) {
    throw errorOf(response.status, payload)
  }
  return schema.parse(payload)
}

export interface ApiFile {
  bytes: ArrayBuffer
  disposition: string
}

export async function apiFile(path: `/v1/${string}`): Promise<ApiFile> {
  const response = await fetch(`${serverEnv().apiUrl}${path}`, {
    headers: { authorization: `Bearer ${await accessToken()}` },
    cache: 'no-store',
  })
  if (!response.ok) {
    throw errorOf(response.status, await response.json().catch(() => null))
  }
  return {
    bytes: await response.arrayBuffer(),
    disposition: response.headers.get('content-disposition') ?? 'attachment',
  }
}
