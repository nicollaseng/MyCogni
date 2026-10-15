import { describe, expect, it } from '@jest/globals'
import { locales } from '@mycogni/domain'
import { alertEmail, firstNameOf } from '../../src/modules/alerts/alert-email.ts'

const link = 'https://mycogniapp.com/pro/alerts'

describe('alertEmail', () => {
  it('names only the first name and points to the alerts page', () => {
    const email = alertEmail({
      to: 'helena@exemplo.com',
      locale: 'pt-BR',
      patientName: '  Ana   Lima Souza ',
      link,
    })

    expect(email.to).toBe('helena@exemplo.com')
    expect(email.subject).toBe('Alerta urgente no MyCogniAI')
    expect(email.html).toContain('<html lang="pt-BR">')
    expect(email.html).toContain(`href="${link}"`)
    expect(email.text).toContain('Ana precisa da sua atenção')
    expect(email.text).toContain(`Abrir alertas: ${link}`)
    expect(email.text).not.toContain('Lima')
  })

  it('writes in the language of the professional', () => {
    const subjects = locales.map(
      (locale) => alertEmail({ to: 'a@b.co', locale, patientName: 'Ana', link }).subject,
    )
    expect(subjects).toEqual([
      'Alerta urgente no MyCogniAI',
      'Alerta urgente no MyCogniAI',
      'Urgent alert on MyCogniAI',
      'Urgent alert on MyCogniAI',
    ])
    expect(alertEmail({ to: 'a@b.co', locale: 'pt-PT', patientName: 'Ana', link }).text).toContain(
      'Foi aberto um alerta urgente',
    )
  })

  it('says a patient when there is no name and never lets a name inject markup', () => {
    expect(alertEmail({ to: 'a@b.co', locale: 'en-US', patientName: null, link }).text).toContain(
      'A patient needs your attention',
    )
    const email = alertEmail({ to: 'a@b.co', locale: 'en-GB', patientName: '<b>x</b>', link })
    expect(email.html).not.toContain('<b>x</b>')
    expect(email.html).toContain('&lt;b&gt;x&lt;/b&gt;')
  })

  it('takes the first word of a name', () => {
    expect(firstNameOf('Bruno Reis')).toBe('Bruno')
    expect(firstNameOf('   ')).toBeNull()
    expect(firstNameOf(null)).toBeNull()
  })
})
