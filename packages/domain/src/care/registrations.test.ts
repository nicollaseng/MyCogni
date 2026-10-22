import { describe, expect, it } from '@jest/globals'
import { professionalKinds } from './professionals.ts'
import {
  brazilianStates,
  councilOf,
  crpRegionOf,
  formatRegistration,
  isBrazilianState,
  isRegistrationNumber,
  needsRegistrationReview,
  parseRegistration,
  registrationIssues,
  registrationDigits,
  registrationLabel,
  storedCouncilRegistration,
} from './registrations.ts'

const crpTable: Readonly<Record<string, string>> = {
  AC: '24',
  AL: '15',
  AP: '10',
  AM: '20',
  BA: '03',
  CE: '11',
  DF: '01',
  ES: '16',
  GO: '09',
  MA: '22',
  MT: '18',
  MS: '14',
  MG: '04',
  PA: '10',
  PB: '13',
  PR: '08',
  PE: '02',
  PI: '21',
  RJ: '05',
  RN: '17',
  RS: '07',
  RO: '24',
  RR: '20',
  SC: '12',
  SP: '06',
  SE: '19',
  TO: '23',
}

const empty = { council: null, uf: null, number: null, text: null }

describe('council registrations', () => {
  it('lists the 27 Brazilian states once each', () => {
    expect(brazilianStates).toHaveLength(27)
    expect(new Set(brazilianStates).size).toBe(27)
    expect(isBrazilianState('SP')).toBe(true)
    expect(isBrazilianState('sp')).toBe(false)
    expect(isBrazilianState('XX')).toBe(false)
  })

  it('derives the council from the profession', () => {
    expect(professionalKinds.map(councilOf)).toEqual(['crp', 'crm', 'crm', null])
  })

  it('maps every state to the region of its psychology council', () => {
    expect(Object.fromEntries(brazilianStates.map((uf) => [uf, crpRegionOf(uf)]))).toEqual(crpTable)
  })

  it('accepts registration numbers of 4 to 8 digits', () => {
    expect(isRegistrationNumber('1234')).toBe(true)
    expect(isRegistrationNumber('12345678')).toBe(true)
    expect(isRegistrationNumber('123')).toBe(false)
    expect(isRegistrationNumber('123456789')).toBe(false)
    expect(isRegistrationNumber('12a456')).toBe(false)
  })

  it('keeps only the digits a person types, up to eight', () => {
    expect(registrationDigits('12.345-6')).toBe('123456')
    expect(registrationDigits('CRP 06/123456')).toBe('06123456')
    expect(registrationDigits('1234567890')).toBe('12345678')
  })

  it('formats CRP and CRM registrations the way councils print them', () => {
    expect(formatRegistration({ council: 'crp', uf: 'SP', number: '123456' })).toBe('CRP 06/123456')
    expect(formatRegistration({ council: 'crp', uf: 'AP', number: '04567' })).toBe('CRP 10/04567')
    expect(formatRegistration({ council: 'crm', uf: 'RJ', number: '123456' })).toBe('CRM-RJ 123456')
  })

  it('parses the state and number of a council registration', () => {
    expect(parseRegistration('psychologist', { uf: 'SP', number: ' 123456 ' })).toEqual({
      ok: true,
      registration: { council: 'crp', uf: 'SP', number: '123456' },
    })
    expect(parseRegistration('physician', { uf: 'MG', number: '9876' })).toEqual({
      ok: true,
      registration: { council: 'crm', uf: 'MG', number: '9876' },
    })
  })

  it('says what is missing or wrong in a council registration', () => {
    expect(parseRegistration('psychiatrist', { uf: '', number: '123456' })).toEqual({
      ok: false,
      issue: 'ufRequired',
    })
    expect(parseRegistration('psychiatrist', { uf: 'XX', number: '123456' })).toEqual({
      ok: false,
      issue: 'ufRequired',
    })
    expect(parseRegistration('psychologist', { uf: 'SP', number: '  ' })).toEqual({
      ok: false,
      issue: 'numberRequired',
    })
    expect(parseRegistration('psychologist', { uf: 'SP', number: '12' })).toEqual({
      ok: false,
      issue: 'numberInvalid',
    })
  })

  it('lists every problem of a council registration at once', () => {
    expect(registrationIssues('psychologist', { uf: '', number: '' })).toEqual([
      'ufRequired',
      'numberRequired',
    ])
    expect(registrationIssues('physician', { uf: 'XX', number: '12' })).toEqual([
      'ufRequired',
      'numberInvalid',
    ])
    expect(registrationIssues('physician', { uf: 'SP', number: '1234' })).toEqual([])
    expect(registrationIssues('psychoanalyst', { uf: '', number: '' })).toEqual([])
  })

  it('asks psychoanalysts for no council registration', () => {
    expect(parseRegistration('psychoanalyst', { uf: '', number: '' })).toEqual({
      ok: true,
      registration: null,
    })
  })

  it('reads a stored registration only when every part is valid', () => {
    expect(
      storedCouncilRegistration({ council: 'crp', uf: 'SP', number: '123456', text: null }),
    ).toEqual({ council: 'crp', uf: 'SP', number: '123456' })
    expect(storedCouncilRegistration(empty)).toBeNull()
    expect(storedCouncilRegistration({ ...empty, council: 'crp', uf: 'SP' })).toBeNull()
    expect(storedCouncilRegistration({ ...empty, council: 'crp', number: '1234' })).toBeNull()
    expect(
      storedCouncilRegistration({ council: 'crm', uf: 'ZZ', number: '1234', text: null }),
    ).toBeNull()
    expect(
      storedCouncilRegistration({ council: 'crm', uf: 'SP', number: '12', text: null }),
    ).toBeNull()
  })

  it('shows the formatted registration, or the free text when there is no council one', () => {
    expect(
      registrationLabel({ council: 'crm', uf: 'SP', number: '123456', text: 'crm sp 123456' }),
    ).toBe('CRM-SP 123456')
    expect(registrationLabel({ ...empty, text: '  Sociedade Psicanalítica 42 ' })).toBe(
      'Sociedade Psicanalítica 42',
    )
    expect(registrationLabel({ ...empty, text: '   ' })).toBeNull()
    expect(registrationLabel(empty)).toBeNull()
  })

  it('flags a council profession without a matching structured registration for review', () => {
    expect(
      needsRegistrationReview('psychologist', {
        council: 'crp',
        uf: 'SP',
        number: '123456',
        text: null,
      }),
    ).toBe(false)
    expect(needsRegistrationReview('psychologist', { ...empty, text: 'CRP 10/1234' })).toBe(true)
    expect(
      needsRegistrationReview('physician', {
        council: 'crp',
        uf: 'SP',
        number: '123456',
        text: null,
      }),
    ).toBe(true)
    expect(needsRegistrationReview('psychoanalyst', empty)).toBe(false)
  })
})
