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

export interface PhotoPayload {
  name: string
  mimeType: string
  buffer: Buffer
}

export async function paintedPhotos(page: Page, hues: readonly number[]): Promise<PhotoPayload[]> {
  const encoded = await page.evaluate(
    (list) =>
      Promise.all(
        list.map(async (hue) => {
          const canvas = new OffscreenCanvas(1200, 1500)
          const context = canvas.getContext('2d')
          if (context === null) {
            throw new Error('No canvas')
          }
          const light = context.createLinearGradient(0, 0, 1200, 1500)
          light.addColorStop(0, `hsl(${String(hue)} 45% 72%)`)
          light.addColorStop(1, `hsl(${String(hue + 40)} 40% 32%)`)
          context.fillStyle = light
          context.fillRect(0, 0, 1200, 1500)
          context.fillStyle = `hsl(${String(hue + 180)} 30% 85% / 0.55)`
          context.beginPath()
          context.arc(820, 520, 260, 0, Math.PI * 2)
          context.fill()
          const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.85 })
          const bytes = new Uint8Array(await blob.arrayBuffer())
          let binary = ''
          for (let start = 0; start < bytes.length; start += 0x8000) {
            binary += String.fromCharCode(...bytes.subarray(start, start + 0x8000))
          }
          return btoa(binary)
        }),
      ),
    hues,
  )
  return encoded.map((data, index) => ({
    name: `foto-${String(index + 1)}.jpg`,
    mimeType: 'image/jpeg',
    buffer: Buffer.from(data, 'base64'),
  }))
}

export function photoTiles(page: Page): Locator {
  return pageBody(page).locator('[data-photo-tile]')
}
