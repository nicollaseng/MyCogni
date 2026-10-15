import { randomUUID } from 'node:crypto'
import { expect, type FileChooser, type Locator, type Page } from '@playwright/test'

type ChosenFiles = Parameters<FileChooser['setFiles']>[0]

export function unique(text: string): string {
  return `${text} ${randomUUID().slice(0, 6)}`
}

export function pageBody(page: Page): Locator {
  return page.getByRole('textbox', { name: 'Texto da página' })
}

export function saveStatus(page: Page): Locator {
  return page.getByRole('main').getByRole('status')
}

export async function startPage(page: Page, title: string, text: string): Promise<string> {
  await page.goto('/mybook')
  await page.getByRole('button', { name: 'Nova página' }).click()
  await expect(page).toHaveURL(/\/mybook\/[0-9a-f-]{36}$/)
  await page.getByLabel('Título da página').fill(title)
  await pageBody(page).click()
  await page.keyboard.type(text)
  await expect(saveStatus(page)).toHaveText('Salvo')
  return new URL(page.url()).pathname.split('/').at(-1) ?? ''
}

export async function choosePhotos(page: Page, files: ChosenFiles): Promise<Locator> {
  const chooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Adicionar foto' }).click()
  await (await chooser).setFiles(files)
  return page.getByRole('dialog', { name: /^Adicionar/ })
}

export async function draftsKept(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      Object.keys(window.localStorage).filter((key) => key.startsWith('mycogni.mybook.draft.'))
        .length,
  )
}
