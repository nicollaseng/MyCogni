import { execFileSync, spawnSync } from 'node:child_process'
import { appendFileSync } from 'node:fs'
import { createRailwayContext, project } from 'railway/iac'
import program from '../../.railway/railway.ts'
import {
  deployWaves,
  deployedCommit,
  verdictOf,
  type ServiceSnapshot,
  type Verdict,
} from './drift-plan.ts'
import { deployCommit, listDeployments, settledStatus } from './railway-cli.ts'

const graceMs = 20 * 60 * 1000
const deployTimeoutMs = 20 * 60 * 1000
const lastWave = new Set(['web'])

interface WatchedService {
  name: string
  branch: string
  watchPatterns: string[]
}

interface Row {
  service: string
  live: string
  verdict: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function watchedServiceOf(resource: unknown): WatchedService[] {
  if (!isRecord(resource) || resource.type !== 'service' || typeof resource.name !== 'string') {
    return []
  }
  const source = isRecord(resource.source) ? resource.source : {}
  const build = isRecord(resource.build) ? resource.build : {}
  if (typeof source.branch !== 'string' || !isStringList(build.watchPatterns)) {
    return []
  }
  return [{ name: resource.name, branch: source.branch, watchPatterns: build.watchPatterns }]
}

async function watchedServices(environment: string): Promise<WatchedService[]> {
  const definition = await program(
    createRailwayContext({ environment, environmentName: environment }),
    project,
  )
  return (definition.resources ?? []).flatMap(watchedServiceOf)
}

function git(args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8' }).trim()
}

function contains(live: string, commit: string): boolean {
  return spawnSync('git', ['merge-base', '--is-ancestor', commit, live]).status === 0
}

function snapshotOf(service: WatchedService, environment: string, now: number): ServiceSnapshot {
  const ref = `origin/${service.branch}`
  const head = git(['rev-parse', ref])
  const pathspecs = service.watchPatterns.map((pattern) => `:(glob)${pattern}`)
  const [relevant = '', committedAt = ''] = git([
    'log',
    '-1',
    '--format=%H%x09%cI',
    ref,
    '--',
    ...pathspecs,
  ]).split('\t')
  const deployments = listDeployments(service.name, environment)
  const live = deployedCommit(deployments)
  return {
    name: service.name,
    deployments,
    deployedIsCurrent: relevant === '' || (live !== null && contains(live, relevant)),
    relevantCommitAgeMs: relevant === '' ? Infinity : now - Date.parse(committedAt),
    head,
  }
}

function describe(verdict: Verdict): string {
  switch (verdict.kind) {
    case 'current':
      return 'current'
    case 'settling':
      return `settling (${verdict.reason})`
    case 'failed':
      return `head ${verdict.commit.slice(0, 8)} already failed, not retrying`
    case 'behind':
      return 'behind'
  }
}

function short(commit: string | null): string {
  return commit === null ? '-' : commit.slice(0, 8)
}

function report(environment: string, rows: Row[], dryRun: boolean): void {
  const lines = [
    `## Railway drift: ${environment}${dryRun ? ' (dry run)' : ''}`,
    '',
    '| Service | Live commit | Result |',
    '| --- | --- | --- |',
    ...rows.map((row) => `| ${row.service} | ${row.live} | ${row.verdict} |`),
  ]
  const markdown = `${lines.join('\n')}\n`
  process.stdout.write(markdown)
  const summary = process.env.GITHUB_STEP_SUMMARY
  if (summary !== undefined && summary !== '') {
    appendFileSync(summary, markdown)
  }
}

interface Outcome {
  head: string
  status: string
}

async function catchUp(
  snapshots: Map<string, ServiceSnapshot>,
  behind: string[],
  environment: string,
): Promise<Map<string, Outcome>> {
  const outcomes = new Map<string, Outcome>()
  for (const wave of deployWaves(behind, lastWave)) {
    const settled = await Promise.all(
      wave.map(async (name) => {
        const head = snapshots.get(name)?.head ?? ''
        const id = deployCommit(name, environment, head)
        return { name, head, status: await settledStatus(name, environment, id, deployTimeoutMs) }
      }),
    )
    for (const { name, head, status } of settled) {
      outcomes.set(name, { head, status })
    }
    if (settled.some(({ status }) => status !== 'SUCCESS')) {
      break
    }
  }
  return outcomes
}

function resultOf(verdict: Verdict, outcome: Outcome | undefined): string {
  return outcome === undefined
    ? describe(verdict)
    : `redeployed ${short(outcome.head)}: ${outcome.status}`
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run')
  const environment = process.env.RAILWAY_ENVIRONMENT ?? 'staging'
  const services = await watchedServices(environment)
  for (const branch of new Set(services.map((service) => service.branch))) {
    git(['fetch', '--quiet', 'origin', branch])
  }
  const now = Date.now()
  const snapshots = new Map(
    services.map((service) => [service.name, snapshotOf(service, environment, now)]),
  )
  const verdicts = new Map(
    [...snapshots.values()].map((snapshot) => [snapshot.name, verdictOf(snapshot, graceMs)]),
  )
  const behind = [...verdicts].filter(([, verdict]) => verdict.kind === 'behind').map(([n]) => n)
  const outcomes = dryRun
    ? new Map<string, Outcome>()
    : await catchUp(snapshots, behind, environment)
  report(
    environment,
    [...verdicts].map(([service, verdict]) => ({
      service,
      live: short(deployedCommit(snapshots.get(service)?.deployments ?? [])),
      verdict: resultOf(verdict, outcomes.get(service)),
    })),
    dryRun,
  )
  const failed =
    [...verdicts.values()].some((verdict) => verdict.kind === 'failed') ||
    [...outcomes.values()].some((outcome) => outcome.status !== 'SUCCESS')
  if (failed) {
    process.exitCode = 1
  }
}

await main()
