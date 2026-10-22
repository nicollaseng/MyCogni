import { describe, expect, it } from '@jest/globals'
import {
  isOwnProfessionalDocumentPath,
  isProfessionalDocumentType,
  professionalDocumentExtension,
  professionalDocumentLimits,
  professionalDocumentName,
  professionalDocumentProblem,
  registrationProofOf,
  sniffDocumentType,
} from './documents.ts'
import { professionalKinds } from './professionals.ts'

function ascii(text: string): Uint8Array {
  return Uint8Array.from(text, (character) => character.charCodeAt(0))
}

const user = '6f1c4a52-61f7-4c1b-9d3c-1b0d2a4f2a10'
const file = 'd2c7a3b1-5e6f-4a8b-9c0d-1e2f3a4b5c6d'

describe('professional documents', () => {
  it('accepts a PDF, JPG or PNG of up to 10 MB', () => {
    expect(isProfessionalDocumentType('application/pdf')).toBe(true)
    expect(isProfessionalDocumentType('image/webp')).toBe(false)
    expect(professionalDocumentExtension('application/pdf')).toBe('pdf')
    expect(
      professionalDocumentProblem({ type: 'image/jpeg', size: professionalDocumentLimits.bytes }),
    ).toBeNull()
    expect(
      professionalDocumentProblem({
        type: 'image/png',
        size: professionalDocumentLimits.bytes + 1,
      }),
    ).toBe('size')
    expect(professionalDocumentProblem({ type: 'text/plain', size: 10 })).toBe('type')
  })

  it('keeps every document in the folder of the professional who sent it', () => {
    expect(isOwnProfessionalDocumentPath(`${user}/${file}.pdf`, user)).toBe(true)
    expect(isOwnProfessionalDocumentPath(`${file}/${user}.pdf`, user)).toBe(false)
    expect(isOwnProfessionalDocumentPath(`${user}/../${file}.pdf`, user)).toBe(false)
    expect(isOwnProfessionalDocumentPath(`${user}/${file}.exe`, user)).toBe(false)
  })

  it('stores a readable file name, or a plain one when nothing is left', () => {
    expect(professionalDocumentName(' Carteira CRP.pdf ', 'application/pdf')).toBe(
      'Carteira CRP.pdf',
    )
    expect(professionalDocumentName('   ', 'image/png')).toBe('document.png')
  })

  it('asks psychoanalysts for proof from their institution and others for their council card', () => {
    expect(professionalKinds.map(registrationProofOf)).toEqual(['crp', 'crm', 'crm', 'institution'])
  })

  it('recognises a document by its content, not by the type it claims', () => {
    expect(sniffDocumentType(ascii('%PDF-1.7'))).toBe('application/pdf')
    expect(sniffDocumentType(Uint8Array.from([0xff, 0xd8, 0xff, 0xdb]))).toBe('image/jpeg')
    expect(sniffDocumentType(ascii('RIFF\u0000\u0000\u0000\u0000WEBPVP8 '))).toBeNull()
    expect(sniffDocumentType(ascii('GIF89a'))).toBeNull()
  })
})
