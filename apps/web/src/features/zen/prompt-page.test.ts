import { describe, expect, it } from '@jest/globals'
import { updateJournalEntrySchema } from '@mycogni/contracts'
import { plainTextOf } from '@/features/mybook/document'
import { promptPage } from './prompt-page'

describe('promptPage', () => {
  it('starts a MyBook page with the prompt as its first line and room to write below', () => {
    const page = promptPage('Como foram suas últimas três noites?')

    expect(updateJournalEntrySchema.safeParse(page).success).toBe(true)
    expect(page.body.content?.[0]?.content?.[0]?.text).toBe('Como foram suas últimas três noites?')
    expect(page.body.content).toHaveLength(2)
    expect(plainTextOf(page.body)).toBe(page.plainText)
    expect(page.title).toBeNull()
  })
})
