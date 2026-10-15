import { describe, expect, it } from '@jest/globals'
import { noteRisk, raisedRisk } from './notes.ts'

describe('noteRisk', () => {
  it('reads the level of a written note', () => {
    expect(noteRisk('Vontade de morrer')).toBe('urgent')
    expect(noteRisk('Apetece-me morrer')).toBe('urgent')
    expect(noteRisk('I want to die')).toBe('urgent')
    expect(noteRisk('ando muito triste')).toBe('watch')
    expect(noteRisk('Dia tranquilo no parque')).toBe('none')
  })

  it('stays quiet when there is no note', () => {
    expect(noteRisk(null)).toBe('none')
    expect(noteRisk('')).toBe('none')
  })
})

describe('raisedRisk', () => {
  it('answers with the new level when a save raises it', () => {
    expect(raisedRisk('', 'Vontade de morrer')).toBe('urgent')
    expect(raisedRisk('ando muito triste', 'ando muito triste. Vontade de morrer')).toBe('urgent')
    expect(raisedRisk('Dia tranquilo', 'Dia tranquilo, mas ando muito triste')).toBe('watch')
  })

  it('stays quiet when the page already had that level or lost it', () => {
    expect(raisedRisk('Vontade de morrer', 'Vontade de morrer. Liguei para o CVV.')).toBe('none')
    expect(raisedRisk('Vontade de morrer', 'ando muito triste')).toBe('none')
    expect(raisedRisk('Vontade de morrer', '')).toBe('none')
    expect(raisedRisk('', 'Dia tranquilo')).toBe('none')
  })
})
