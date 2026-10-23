export interface Deployment {
  id: string
  status: string
  commit: string | null
}

export interface ServiceSnapshot {
  name: string
  deployments: Deployment[]
  deployedIsCurrent: boolean
  relevantCommitAgeMs: number
  head: string
}

export type Verdict =
  | { kind: 'current' }
  | { kind: 'settling'; reason: 'in-progress' | 'recent-commit' }
  | { kind: 'failed'; commit: string }
  | { kind: 'behind'; deployed: string | null }

const inProgress = new Set(['QUEUED', 'WAITING', 'INITIALIZING', 'BUILDING', 'DEPLOYING'])

const broken = new Set(['FAILED', 'CRASHED'])

export function deployedCommit(deployments: Deployment[]): string | null {
  return deployments.find((deployment) => deployment.status === 'SUCCESS')?.commit ?? null
}

export function verdictOf(snapshot: ServiceSnapshot, graceMs: number): Verdict {
  if (snapshot.deployedIsCurrent) {
    return { kind: 'current' }
  }
  if (snapshot.deployments.some((deployment) => inProgress.has(deployment.status))) {
    return { kind: 'settling', reason: 'in-progress' }
  }
  if (snapshot.relevantCommitAgeMs < graceMs) {
    return { kind: 'settling', reason: 'recent-commit' }
  }
  const failedHead = snapshot.deployments.some(
    (deployment) => deployment.commit === snapshot.head && broken.has(deployment.status),
  )
  if (failedHead) {
    return { kind: 'failed', commit: snapshot.head }
  }
  return { kind: 'behind', deployed: deployedCommit(snapshot.deployments) }
}

export function deployWaves(names: string[], lastWave: ReadonlySet<string>): string[][] {
  const first = names.filter((name) => !lastWave.has(name))
  const last = names.filter((name) => lastWave.has(name))
  return [first, last].filter((wave) => wave.length > 0)
}

export function isSettled(status: string): boolean {
  return !inProgress.has(status)
}
