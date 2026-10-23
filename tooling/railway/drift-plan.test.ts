import assert from 'node:assert/strict'
import { test } from 'node:test'
import { deployWaves, deployedCommit, verdictOf, type ServiceSnapshot } from './drift-plan.ts'

const grace = 20 * 60 * 1000

function snapshot(overrides: Partial<ServiceSnapshot>): ServiceSnapshot {
  return {
    name: 'api',
    deployments: [{ id: 'd1', status: 'SUCCESS', commit: 'old' }],
    deployedIsCurrent: false,
    relevantCommitAgeMs: grace * 2,
    head: 'head',
    ...overrides,
  }
}

await test('deployedCommit takes the newest successful deployment and ignores skipped ones', () => {
  const deployments = [
    { id: 'd3', status: 'SKIPPED', commit: 'web-only' },
    { id: 'd2', status: 'SUCCESS', commit: 'live' },
    { id: 'd1', status: 'REMOVED', commit: 'older' },
  ]
  assert.equal(deployedCommit(deployments), 'live')
})

await test('deployedCommit is null when nothing ever succeeded', () => {
  assert.equal(deployedCommit([{ id: 'd1', status: 'FAILED', commit: 'x' }]), null)
})

await test('verdictOf is current when the live commit already contains the latest relevant change', () => {
  assert.deepEqual(verdictOf(snapshot({ deployedIsCurrent: true }), grace), { kind: 'current' })
})

await test('verdictOf waits while a deployment is still running', () => {
  const deployments = [
    { id: 'd2', status: 'BUILDING', commit: 'head' },
    { id: 'd1', status: 'SUCCESS', commit: 'old' },
  ]
  assert.deepEqual(verdictOf(snapshot({ deployments }), grace), {
    kind: 'settling',
    reason: 'in-progress',
  })
})

await test('verdictOf leaves a fresh push to the regular auto deploy', () => {
  assert.deepEqual(verdictOf(snapshot({ relevantCommitAgeMs: grace / 2 }), grace), {
    kind: 'settling',
    reason: 'recent-commit',
  })
})

await test('verdictOf does not retry a head that already failed', () => {
  const deployments = [
    { id: 'd2', status: 'FAILED', commit: 'head' },
    { id: 'd1', status: 'SUCCESS', commit: 'old' },
  ]
  assert.deepEqual(verdictOf(snapshot({ deployments }), grace), {
    kind: 'failed',
    commit: 'head',
  })
})

await test('verdictOf flags a service left behind by a dropped or skipped deploy', () => {
  const deployments = [
    { id: 'd2', status: 'SKIPPED', commit: 'head' },
    { id: 'd1', status: 'SUCCESS', commit: 'old' },
  ]
  assert.deepEqual(verdictOf(snapshot({ deployments }), grace), {
    kind: 'behind',
    deployed: 'old',
  })
})

await test('deployWaves ships the backend before the web', () => {
  assert.deepEqual(deployWaves(['web', 'api', 'worker'], new Set(['web'])), [
    ['api', 'worker'],
    ['web'],
  ])
})

await test('deployWaves drops empty waves', () => {
  assert.deepEqual(deployWaves(['web'], new Set(['web'])), [['web']])
})
