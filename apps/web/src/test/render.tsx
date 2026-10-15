import type { Locale } from '@mycogni/domain'
import { render, type RenderOptions, type RenderResult } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import type { ReactElement, ReactNode } from 'react'
import { messagesFor } from '@/i18n/messages'

interface IntlRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  locale?: Locale
}

export function renderWithIntl(
  ui: ReactElement,
  { locale = 'pt-BR', ...options }: IntlRenderOptions = {},
): RenderResult {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <NextIntlClientProvider
        locale={locale}
        messages={messagesFor(locale)}
        timeZone="America/Sao_Paulo"
      >
        {children}
      </NextIntlClientProvider>
    )
  }
  return render(ui, { wrapper: Wrapper, ...options })
}
