import { describe, expect, it } from '@jest/globals'
import { guarded, settledValue } from './settled'

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('guarded', () => {
  it('waits for the check and the data together and returns both', async () => {
    const started: string[] = []
    const check = (async () => {
      started.push('check')
      await pause(20)
      return 'ana'
    })()
    const data = (async () => {
      started.push('data')
      await pause(20)
      return [1, 2]
    })()

    await expect(guarded(check, data)).resolves.toEqual(['ana', [1, 2]])
    expect(started).toEqual(['check', 'data'])
  })

  it('lets a failed check win over a failed data request, whichever ends first', async () => {
    const redirect = new Error('redirect to sign in')
    const check = pause(30).then(() => Promise.reject(redirect))
    const data = Promise.reject(new Error('API answered 401'))

    await expect(guarded(check, data)).rejects.toBe(redirect)
  })

  it('reports a failed data request once the check passes', async () => {
    const failure = new Error('API answered 500')

    await expect(guarded(Promise.resolve('ana'), Promise.reject(failure))).rejects.toBe(failure)
  })
})

describe('settledValue', () => {
  it('unwraps a fulfilled result and rethrows a rejected one', () => {
    const reason = new Error('missing')

    expect(settledValue({ status: 'fulfilled', value: 3 })).toBe(3)
    expect(() => settledValue({ status: 'rejected', reason })).toThrow(reason)
  })
})
