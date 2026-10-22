import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { finishOnboarding, inviteByLink, verifiedProfessional } from './support/api'
import { signedOut } from './support/session'
import { createUser, uniqueEmail } from './support/supabase'

const password = 'cuidado-e2e-2026'

function uniqueName(name: string): string {
  return `${name} ${randomUUID().slice(0, 6)}`
}

async function professional(name: string): Promise<string> {
  const email = uniqueEmail('pro')
  await verifiedProfessional(email, password, name)
  return email
}

test('accepts an invitation by link, keeps one link per professional and ends it', async ({
  page,
}) => {
  const name = uniqueName('Helena Prado')
  const email = await professional(name)
  const first = await inviteByLink(email, password)

  await page.goto(`/invite/${first.code.toLowerCase()}`)
  await expect(page).toHaveURL(`/invite/${first.code}`)
  await expect(
    page.getByRole('heading', { level: 1, name: `${name} quer acompanhar seus registros.` }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Ver o convite' }).click()

  await expect(page).toHaveURL(/\/invites\/[0-9a-f-]{36}$/)
  await expect(page.getByText(/^Psicologia · CRP 06\/\d{8}$/)).toBeVisible()
  const history = page.getByRole('switch', {
    name: 'Compartilhar também meus registros anteriores',
  })
  await expect(history).toHaveAttribute('aria-checked', 'false')
  await page.getByRole('button', { name: 'Aceitar', exact: true }).click()

  await expect(page).toHaveURL('/me/professionals')
  const professionals = page.getByRole('region', { name: 'Profissionais' })
  const link = professionals.getByRole('listitem').filter({ hasText: name })
  await expect(link).toContainText('Só registros a partir do vínculo')

  const second = await inviteByLink(email, password)
  await page.goto(`/invite/${second.code}`)
  await page.getByRole('button', { name: 'Ver o convite' }).click()
  await expect(page).toHaveURL(/\/invites\/[0-9a-f-]{36}$/)
  await page.getByRole('button', { name: 'Aceitar', exact: true }).click()
  await expect(page.getByRole('main').getByRole('alert')).toHaveText(
    `Você já compartilha seus registros com ${name}.`,
  )

  await page.goto('/me/professionals')
  await link.getByRole('button', { name: 'Encerrar vínculo' }).click()
  await expect(link).toContainText(`${name} deixa de ver seus registros a partir de agora.`)
  await link.getByRole('button', { name: 'Encerrar vínculo' }).click()
  await expect(professionals.getByText(name)).toHaveCount(0)
})

test.describe('a visitor', () => {
  test.use({ storageState: signedOut })

  test('sees who invites and what sharing means before creating an account', async ({ page }) => {
    const name = uniqueName('Marta Ribeiro')
    const { code } = await inviteByLink(await professional(name), password)

    await page.goto(`/invite/${code}`)

    await expect(page.getByText('Convite · Psicologia')).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 1, name: `${name} quer acompanhar seus registros.` }),
    ).toBeVisible()
    await expect(page.getByRole('region', { name: `O que ${name} vai ver` })).toContainText(
      'Suas respostas sobre ânimo e ansiedade',
    )
    await expect(page.getByText('O convite vale por mais 3 dias.')).toBeVisible()
    await page.getByRole('link', { name: 'Criar conta para responder' }).click()

    await expect(page).toHaveURL('/sign-up')
  })

  test('is told when the invitation does not exist', async ({ page }) => {
    await page.goto('/invite/ZZZZZZZZ')

    await expect(
      page.getByRole('heading', { level: 1, name: 'Não encontramos este convite.' }),
    ).toBeVisible()
  })

  test('signs in from the invitation, decides later and finds it in the bell', async ({ page }) => {
    const name = uniqueName('Rafael Costa')
    const { code } = await inviteByLink(await professional(name), password)
    const patient = uniqueEmail('paciente')
    await createUser(patient, password)
    await finishOnboarding(patient, password)

    await page.goto(`/invite/${code}`)
    await page.getByRole('link', { name: 'Já tenho conta' }).click()
    await expect(page).toHaveURL('/sign-in')
    await page.getByLabel('Email').fill(patient)
    await page.getByLabel('Senha').fill(password)
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()

    await expect(page).toHaveURL(`/invite/${code}`)
    await page.getByRole('button', { name: 'Ver o convite' }).click()
    await expect(page).toHaveURL(/\/invites\/[0-9a-f-]{36}$/)
    await page.getByRole('link', { name: 'Decidir depois' }).click()

    await expect(page).toHaveURL('/invites')
    await expect(
      page.getByRole('region', { name: 'Aguardando sua resposta' }).getByRole('link'),
    ).toContainText(name)
    await page.getByRole('button', { name: 'Notificações, 1 não lida' }).click()
    await page.getByRole('menuitem', { name: 'Ver todas' }).click()

    await expect(page).toHaveURL('/notifications')
    await expect(page.getByRole('main').getByRole('listitem')).toContainText(
      `${name} convidou você para acompanhar seus registros.`,
    )
    await expect(page.getByRole('button', { name: 'Notificações', exact: true })).toBeVisible()
  })
})
