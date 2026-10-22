import type { Locator, Page } from '@playwright/test'

export const keyboardHeight = 320

export async function simulateKeyboard(page: Page, height = keyboardHeight): Promise<void> {
  await page.addInitScript((keyboard: number) => {
    const viewport = window.visualViewport
    if (viewport === null) {
      return
    }
    let open = false
    Object.defineProperty(viewport, 'height', {
      configurable: true,
      get: () => window.innerHeight - (open ? keyboard : 0),
    })
    Object.defineProperty(viewport, 'offsetTop', { configurable: true, get: () => 0 })
    const typing = (element: Element | null): boolean =>
      element instanceof HTMLTextAreaElement ||
      (element instanceof HTMLInputElement && ['text', 'search', 'email'].includes(element.type)) ||
      (element instanceof HTMLElement && element.isContentEditable)
    const settle = () => {
      window.setTimeout(() => {
        const next = typing(document.activeElement)
        if (next !== open) {
          open = next
          viewport.dispatchEvent(new Event('resize'))
        }
      }, 30)
    }
    document.addEventListener('focusin', settle)
    document.addEventListener('focusout', settle)
  }, height)
}

export function keyboardTop(page: Page, height = keyboardHeight): Promise<number> {
  return page.evaluate((keyboard: number) => window.innerHeight - keyboard, height)
}

export function formatBar(page: Page): Locator {
  return page.getByRole('toolbar', { name: 'Formatação' })
}

export function tabBar(page: Page): Locator {
  return page.getByRole('navigation', { name: 'Navegação principal', includeHidden: true }).last()
}
