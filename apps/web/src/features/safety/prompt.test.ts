import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals'
import type { CareLink } from '@mycogni/contracts'
import type * as Prompt from './prompt'

const fetchCareLinks = jest.fn<() => Promise<Pick<CareLink, 'professional'>[]>>()

jest.mock('@/shared/lib/api/care', () => ({
  fetchCareLinks: () => fetchCareLinks(),
}))

let prompt: typeof Prompt

beforeAll(async () => {
  prompt = await import('./prompt')
})

describe('safetyPromptFor', () => {
  beforeEach(() => {
    fetchCareLinks.mockReset()
    fetchCareLinks.mockResolvedValue([
      {
        professional: {
          name: 'Helena Prado',
          kind: 'psychologist',
          registration: 'CRP 06/123456',
          photoUrl: null,
          emergencyWhatsapp: null,
        },
      },
    ])
  })

  it('offers crisis help only for a note with a sign of risk', async () => {
    expect(await prompt.safetyPromptFor('urgent')).toEqual({
      professionals: [{ name: 'Helena Prado', emergencyWhatsapp: null }],
    })
    expect(await prompt.safetyPromptFor('watch')).toBeNull()
    expect(await prompt.safetyPromptFor('none')).toBeNull()
    expect(fetchCareLinks).toHaveBeenCalledTimes(1)
  })

  it('still offers the lines when the professionals cannot be read', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
    fetchCareLinks.mockRejectedValue(new Error('offline'))

    expect(await prompt.safetyPromptFor('urgent')).toEqual({ professionals: [] })
  })
})
