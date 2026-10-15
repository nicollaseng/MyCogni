import type { UploadProblem } from '@mycogni/domain'
import { NextResponse } from 'next/server'

const statuses: Readonly<Record<UploadProblem, number>> = { type: 415, size: 413 }

export function refuse(status: number, code: string): NextResponse {
  return NextResponse.json({ code }, { status })
}

export function refuseFile(problem: UploadProblem): NextResponse {
  return refuse(statuses[problem], problem === 'type' ? 'UNSUPPORTED_TYPE' : 'TOO_LARGE')
}
