import { describe, expect, it } from '@jest/globals'
import { emptyJoinValues, joinIssues, registrationInput, type JoinValues } from './join'

function values(changes: Partial<JoinValues>): JoinValues {
  return { ...emptyJoinValues, fullName: 'Helena Prado', accepted: true, ...changes }
}

describe('join', () => {
  it('sends the state and number of a council registration, without free text', () => {
    expect(
      registrationInput(
        'psychologist',
        values({ kind: 'psychologist', uf: 'SP', number: '123456', institutionRegistration: 'x' }),
      ),
    ).toEqual({
      kind: 'psychologist',
      fullName: 'Helena Prado',
      registration: { uf: 'SP', number: '123456' },
      institutionRegistration: null,
    })
  })

  it('sends only the optional institution registration of a psychoanalyst', () => {
    expect(
      registrationInput(
        'psychoanalyst',
        values({ kind: 'psychoanalyst', uf: 'SP', institutionRegistration: ' SBP 42 ' }),
      ),
    ).toEqual({
      kind: 'psychoanalyst',
      fullName: 'Helena Prado',
      registration: null,
      institutionRegistration: 'SBP 42',
    })
    expect(
      registrationInput('psychoanalyst', values({ kind: 'psychoanalyst' })).institutionRegistration,
    ).toBeNull()
  })

  it('checks the size of the institution registration only when one is given', () => {
    expect(joinIssues(values({ kind: 'psychoanalyst' }))).toEqual({})
    expect(joinIssues(values({ kind: 'psychoanalyst', institutionRegistration: 'ab' }))).toEqual({
      institution: 'institutionTooShort',
    })
    expect(
      joinIssues(values({ kind: 'psychoanalyst', institutionRegistration: 'a'.repeat(41) })),
    ).toEqual({ institution: 'institutionTooLong' })
  })

  it('asks for the profession before anything about the registration', () => {
    expect(joinIssues(values({ fullName: 'a'.repeat(121) }))).toEqual({
      kind: 'kindRequired',
      fullName: 'fullNameTooLong',
    })
  })
})
