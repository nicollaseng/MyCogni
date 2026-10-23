import { execFileSync } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { isSettled, type Deployment } from './drift-plan.ts'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null
}

function deploymentOf(value: unknown): Deployment | null {
  if (!isRecord(value)) {
    return null
  }
  const id = text(value.id)
  const status = text(value.status)
  if (id === null || status === null) {
    return null
  }
  const meta = isRecord(value.meta) ? value.meta : {}
  return { id, status, commit: text(meta.commitHash) }
}

function railway(args: string[]): string {
  return execFileSync('railway', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
}

export function listDeployments(service: string, environment: string): Deployment[] {
  const output: unknown = JSON.parse(
    railway([
      'deployment',
      'list',
      '--service',
      service,
      '--environment',
      environment,
      '--limit',
      '50',
      '--json',
    ]),
  )
  if (!Array.isArray(output)) {
    throw new Error(`Unexpected deployment list for ${service}`)
  }
  return output.map(deploymentOf).filter((deployment) => deployment !== null)
}

export function deployCommit(service: string, environment: string, commit: string): string {
  const output: unknown = JSON.parse(
    railway([
      'deployment',
      'redeploy',
      '--service',
      service,
      '--environment',
      environment,
      '--commit',
      commit,
      '--yes',
      '--json',
    ]),
  )
  const id = isRecord(output) ? text(output.id) : null
  if (id === null) {
    throw new Error(`Railway did not return a deployment id for ${service}`)
  }
  return id
}

export async function settledStatus(
  service: string,
  environment: string,
  deploymentId: string,
  timeoutMs: number,
): Promise<string> {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    const status =
      listDeployments(service, environment).find((deployment) => deployment.id === deploymentId)
        ?.status ?? 'QUEUED'
    if (isSettled(status) || Date.now() > deadline) {
      return status
    }
    await sleep(20_000)
  }
}
