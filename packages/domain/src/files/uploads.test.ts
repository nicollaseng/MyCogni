import { describe, expect, it } from '@jest/globals'
import { cleanFileName, uploadProblem } from './uploads.ts'

const rule = { accepts: (type: string) => type === 'image/png', maxBytes: 100 }

describe('uploadProblem', () => {
  it('names what is wrong with a file before it is sent', () => {
    expect(uploadProblem({ type: 'image/png', size: 100 }, rule)).toBeNull()
    expect(uploadProblem({ type: 'image/gif', size: 10 }, rule)).toBe('type')
    expect(uploadProblem({ type: 'image/png', size: 101 }, rule)).toBe('size')
    expect(uploadProblem({ type: 'image/png', size: 0 }, rule)).toBe('size')
  })
})

describe('cleanFileName', () => {
  it('keeps a readable name without folders, control characters or extra length', () => {
    expect(cleanFileName('  carteira   CRP.pdf ', 50)).toBe('carteira CRP.pdf')
    expect(cleanFileName('../../etc/passwd', 50)).toBe('.. .. etc passwd')
    expect(cleanFileName('nome\u0000\ncom\tquebras.png', 50)).toBe('nome com quebras.png')
    expect(cleanFileName('abcdef ghij', 7)).toBe('abcdef')
  })
})
