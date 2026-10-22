import type { Page } from '@playwright/test'

export async function tickChecklist(page: Page): Promise<void> {
  for (const box of await page.getByRole('checkbox').all()) {
    await box.check()
  }
}
