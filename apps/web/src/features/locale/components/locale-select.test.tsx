import { describe, expect, it, jest } from '@jest/globals'
import type { Locale } from '@mycogni/domain'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import { LocaleSelect } from './locale-select'

describe('LocaleSelect', () => {
  it('offers every language by its own name, with the current one selected', () => {
    renderWithIntl(<LocaleSelect choose={jest.fn<(locale: Locale) => Promise<void>>()} />, {
      locale: 'pt-PT',
    })

    const select = screen.getByRole('combobox', { name: 'Idioma' })
    expect(select).toHaveValue('pt-PT')
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Português (Brasil)',
      'Português (Portugal)',
      'English (US)',
      'English (UK)',
    ])
  })

  it('switches to the language the person picks', async () => {
    const choose = jest.fn<(locale: Locale) => Promise<void>>().mockResolvedValue()
    renderWithIntl(<LocaleSelect choose={choose} />, { locale: 'en-US' })

    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Language' }),
      'Português (Brasil)',
    )

    expect(choose).toHaveBeenCalledWith('pt-BR')
  })
})
