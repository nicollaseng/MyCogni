import { describe, expect, it } from '@jest/globals'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const templatesDirectory = join(process.cwd(), '..', '..', 'supabase', 'templates')

function template(name: string): string {
  return readFileSync(join(templatesDirectory, `${name}.html`), 'utf8').replace(/\s+/g, ' ')
}

describe.each([
  {
    name: 'confirmation',
    type: 'email',
    labels: ['Confirm email', 'Confirmar email'],
    leads: [
      'Prefer not to type the code? Confirm with one tap.',
      'Prefere não introduzir o código? Confirme com um toque.',
      'Prefere não digitar o código? Confirme com um toque.',
    ],
  },
  {
    name: 'recovery',
    type: 'recovery',
    labels: ['Choose a new password', 'Escolher nova palavra-passe', 'Escolher nova senha'],
    leads: [
      'Prefer not to type the code? Choose the new password with one tap.',
      'Prefere não introduzir o código? Escolha a nova palavra-passe com um toque.',
      'Prefere não digitar o código? Escolha a nova senha com um toque.',
    ],
  },
])('$name email template', ({ name, type, labels, leads }) => {
  const html = template(name)
  const link = `href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=${type}"`

  it('keeps the six digit code as the main element, above the link', () => {
    expect(html).toContain('{{ .Token }}')
    expect(html.indexOf('{{ .Token }}')).toBeLessThan(html.indexOf(link))
  })

  it('links to the confirm route with the token hash, never to the default link', () => {
    expect(html.split(link)).toHaveLength(2)
    expect(html).not.toContain('.ConfirmationURL')
  })

  it('explains the link in Brazilian Portuguese, European Portuguese and English', () => {
    expect(html).toContain('{{ if or (eq $locale "en-US") (eq $locale "en-GB") }}')
    expect(html).toContain('{{ else if eq $locale "pt-PT" }}')
    for (const text of [...labels, ...leads]) {
      expect(html).toContain(text)
    }
  })
})
