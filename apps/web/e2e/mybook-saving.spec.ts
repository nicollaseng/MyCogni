import { randomUUID } from 'node:crypto'
import { expect, test, type Page } from '@playwright/test'
import {
  choosePhotos,
  draftsKept,
  pageBody,
  photoTiles,
  saveStatus,
  startPage,
  unique,
} from './support/mybook'
import { signedOut } from './support/session'

const content = '**/mybook/*/content'

async function cameraPhoto(page: Page): Promise<Buffer> {
  const encoded = await page.evaluate(async () => {
    const canvas = new OffscreenCanvas(4000, 3000)
    const context = canvas.getContext('2d')
    if (context === null) {
      throw new Error('No canvas')
    }
    const light = context.createLinearGradient(0, 0, 4000, 3000)
    light.addColorStop(0, '#3f6b5c')
    light.addColorStop(1, '#dde6ee')
    context.fillStyle = light
    context.fillRect(0, 0, 4000, 3000)
    const grain = context.createImageData(400, 300)
    for (let index = 0; index < grain.data.length; index += 1) {
      grain.data[index] = index % 4 === 3 ? 60 : Math.floor(Math.random() * 256)
    }
    const tile = new OffscreenCanvas(400, 300)
    tile.getContext('2d')?.putImageData(grain, 0, 0)
    for (let x = 0; x < 4000; x += 400) {
      for (let y = 0; y < 3000; y += 300) {
        context.drawImage(tile, x, y)
      }
    }
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.92 })
    const bytes = new Uint8Array(await blob.arrayBuffer())
    let binary = ''
    for (let start = 0; start < bytes.length; start += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(start, start + 0x8000))
    }
    return btoa(binary)
  })
  return Buffer.from(encoded, 'base64')
}

async function writeAtTheEnd(page: Page, text: string): Promise<void> {
  await pageBody(page).click()
  await page.keyboard.press('ControlOrMeta+End')
  await page.keyboard.type(text)
}

test('adds a large photo at the medium size without breaking the page', async ({ page }) => {
  await startPage(page, unique('Foto grande'), 'Um dia de luz.')
  const photo = await cameraPhoto(page)
  expect(photo.length).toBeGreaterThan(1024 * 1024)

  const sheet = await choosePhotos(page, {
    name: 'camera.jpg',
    mimeType: 'image/jpeg',
    buffer: photo,
  })
  await sheet.getByRole('button', { name: 'Qualidade: Média' }).click()
  const medium = sheet.getByRole('radio', { name: /^Média/ })
  await expect(medium).toBeChecked()
  await expect(medium).toHaveAccessibleName(/Até 1600 px ≈ \d+ kB/)
  await expect(sheet.getByRole('radio', { name: /^Original/ })).toHaveAccessibleName(
    /O arquivo como está [\d,]+ MB/,
  )
  await sheet.getByRole('button', { name: 'Adicionar', exact: true }).click()
  await expect(sheet).toBeHidden()

  const image = photoTiles(page).locator('img')
  await expect(photoTiles(page)).toHaveAttribute('style', /aspect-ratio: 1\.333/)
  await expect(image).toHaveAttribute('loading', 'lazy')
  await page.keyboard.type('Depois da foto, um café.')
  await expect(image).toHaveCount(1)
  await expect(pageBody(page)).toContainText('Depois da foto, um café.')
  await expect(saveStatus(page)).toHaveText('Salvo')
  await expect.poll(() => draftsKept(page)).toBe(0)

  await page.reload()

  await expect(pageBody(page)).toContainText('Depois da foto, um café.')
  await image.scrollIntoViewIfNeeded()
  await expect(image).toBeVisible()
  await expect
    .poll(() =>
      image.evaluate((element: HTMLImageElement) => [element.naturalWidth, element.naturalHeight]),
    )
    .toEqual([1600, 1200])
  const shown = await image.boundingBox()
  const text = await pageBody(page).boundingBox()
  expect(shown?.width).toBeLessThanOrEqual(text?.width ?? 0)
  expect(shown?.height).toBeLessThanOrEqual(page.viewportSize()?.height ?? 0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
})

test('keeps what was written on this device while saving fails and restores it', async ({
  page,
}) => {
  await startPage(page, unique('Sem rede'), 'Primeira linha.')
  await page.route(content, (route) => route.abort())

  await writeAtTheEnd(page, ' Segunda linha guardada.')
  await expect(saveStatus(page)).toContainText('Não foi possível salvar.')
  expect(await draftsKept(page)).toBe(1)

  await page.reload()

  await expect(pageBody(page)).toContainText('Primeira linha. Segunda linha guardada.')
  await expect(saveStatus(page)).toContainText('Não foi possível salvar.')

  await page.unroute(content)
  await saveStatus(page).getByRole('button', { name: 'Tentar de novo' }).click()
  await expect(saveStatus(page)).toHaveText('Salvo')
  await expect.poll(() => draftsKept(page)).toBe(0)

  await page.reload()
  await expect(pageBody(page)).toContainText('Primeira linha. Segunda linha guardada.')
})

test('asks to reload when the app was updated and keeps the text', async ({ page }) => {
  await startPage(page, unique('Atualizado'), 'Antes da atualização.')
  await page.route(content, (route) =>
    route.fulfill({ status: 409, json: { code: 'OUTDATED_CLIENT' } }),
  )

  await writeAtTheEnd(page, ' Depois dela.')
  const notice = page.getByRole('main').getByRole('alert')
  await expect(notice).toContainText(
    'O app foi atualizado. Recarregue para continuar — seu texto está guardado.',
  )
  await expect(page.getByRole('button', { name: 'Tentar de novo' })).toHaveCount(0)

  await page.unroute(content)
  await notice.getByRole('button', { name: 'Recarregar' }).click()

  await expect(pageBody(page)).toContainText('Antes da atualização. Depois dela.')
  await expect(saveStatus(page)).toHaveText('Salvo')
  await expect.poll(() => draftsKept(page)).toBe(0)
})

test('the page address refuses outdated clients, invalid pages and signed-out requests', async ({
  page,
  browser,
  baseURL,
}) => {
  const id = await startPage(page, unique('Endereço'), 'Texto.')
  const valid = {
    title: 'Endereço',
    body: { type: 'doc', content: [] },
    plainText: '',
    imagePaths: [],
  }
  const headers = { 'x-mybook-client': '1' }

  const outdated = await page.request.put(`/mybook/${id}/content`, { data: valid })
  expect(outdated.status()).toBe(409)
  expect(await outdated.json()).toEqual({ code: 'OUTDATED_CLIENT' })

  const invalid = await page.request.put(`/mybook/${id}/content`, {
    headers,
    data: { title: 3 },
  })
  expect(invalid.status()).toBe(422)

  const missing = await page.request.put(`/mybook/${randomUUID()}/content`, {
    headers,
    data: valid,
  })
  expect(missing.status()).toBe(404)

  const visitor = await browser.newContext({ baseURL, storageState: signedOut })
  const anonymous = await visitor.request.put(`/mybook/${id}/content`, { headers, data: valid })
  expect(anonymous.status()).toBe(401)
  expect((await visitor.request.post('/mybook/entries', { headers })).status()).toBe(401)
  await visitor.close()

  const saved = await page.request.put(`/mybook/${id}/content`, { headers, data: valid })
  expect(saved.status()).toBe(200)
})
