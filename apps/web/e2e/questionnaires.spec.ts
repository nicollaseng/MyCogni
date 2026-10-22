import { randomUUID } from 'node:crypto'
import { expect, test, type Page } from '@playwright/test'
import {
  acceptInvitation,
  finishOnboarding,
  inviteByLink,
  releaseQuestionnaire,
  rename,
  verifiedProfessional,
} from './support/api'
import { latestMail } from './support/mailpit'
import { signedOut } from './support/session'
import { createUser, uniqueEmail } from './support/supabase'

test.use({ storageState: signedOut })

const password = 'questionarios-e2e-2026'

interface Care {
  professionalEmail: string
  patientEmail: string
  patientId: string
  patientName: string
}

async function linkedCare(): Promise<Care> {
  const suffix = randomUUID().slice(0, 6)
  const professionalEmail = uniqueEmail('pro')
  await verifiedProfessional(professionalEmail, password, `Helena Prado ${suffix}`)
  const patientEmail = uniqueEmail('patient')
  const patientName = `Marina Costa ${suffix}`
  const patientId = await createUser(patientEmail, password)
  await finishOnboarding(patientEmail, password)
  await rename(patientEmail, password, patientName)
  const { code } = await inviteByLink(professionalEmail, password)
  await acceptInvitation(patientEmail, password, code)
  return { professionalEmail, patientEmail, patientId, patientName }
}

async function signIn(page: Page, email: string): Promise<void> {
  await page.context().clearCookies()
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).not.toHaveURL(/\/sign-in/)
}

async function openReleaseDialog(page: Page, care: Care) {
  await page.goto(`/pro/patients/${care.patientId}`)
  await page.getByRole('button', { name: 'Liberar questionário' }).click()
  const dialog = page.getByRole('dialog', { name: 'Liberar questionário' })
  await expect(dialog).toBeVisible()
  return dialog
}

function released(page: Page) {
  return page.getByRole('table', { name: 'Questionários' })
}

async function answer(page: Page, choices: readonly string[], from: number, total: number) {
  for (const [offset, choice] of choices.entries()) {
    await expect(
      page.getByText(`Pergunta ${String(from + offset)} de ${String(total)}`),
    ).toBeVisible()
    await page.getByRole('button', { name: choice, exact: true }).click()
  }
}

async function startFromToday(page: Page): Promise<void> {
  await page.goto('/today')
  const card = page.getByRole('region', { name: 'Seu profissional liberou um questionário' })
  await expect(card).toContainText('Sobre ânimo')
  await card.getByRole('link').first().click()
}

test('a professional releases a PHQ-9, the patient answers and both see their view', async ({
  page,
}) => {
  const care = await linkedCare()
  await signIn(page, care.professionalEmail)
  const dialog = await openReleaseDialog(page, care)
  await expect(dialog.getByRole('radio', { name: /^PHQ-9/ })).toBeChecked()
  await dialog.getByLabel('Mensagem para o paciente (opcional)').fill('Antes da consulta de sexta.')
  await dialog.getByRole('button', { name: 'Liberar', exact: true }).click()
  await expect(page.getByText('Questionário liberado. O paciente foi avisado.')).toBeVisible()
  await expect(released(page).getByRole('row', { name: /PHQ-9/ })).toContainText('Liberado')

  const mail = await latestMail(care.patientEmail, /Seu profissional liberou um questionário/)
  expect(mail).not.toContain('PHQ')

  await signIn(page, care.patientEmail)
  await startFromToday(page)
  await expect(page.getByRole('heading', { name: 'Sobre ânimo' })).toBeVisible()
  await expect(page.getByText('Antes da consulta de sexta.')).toBeVisible()
  await expect(
    page.getByText(
      'Seu profissional verá suas respostas completas. Você verá um resumo simples. Isto não é um diagnóstico.',
    ),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Começar' }).click()
  await expect(
    page.getByText(
      'Durante as últimas 2 semanas, com que freqüência você foi incomodado/a por qualquer um dos problemas abaixo?',
    ),
  ).toBeVisible()
  await answer(
    page,
    ['Vários dias', 'Vários dias', 'Mais da metade dos dias', 'Vários dias', 'Nenhuma vez'],
    1,
    9,
  )
  await answer(page, ['Nenhuma vez', 'Nenhuma vez', 'Nenhuma vez', 'Nenhuma vez'], 6, 9)
  await expect(page.getByRole('heading', { name: 'Obrigado por responder.' })).toBeVisible()
  await expect(page.getByText('Leve', { exact: true })).toBeVisible()
  await expect(page.getByText('Converse com seu profissional sobre isso.')).toBeVisible()
  await expect(page.getByText(/PHQ|pontua/i)).toHaveCount(0)

  await page.goto('/me/questionnaires')
  await expect(page.getByRole('region', { name: 'Respondidos' })).toContainText('Desânimo: Leve')

  await signIn(page, care.professionalEmail)
  await page.goto(`/pro/patients/${care.patientId}`)
  const row = released(page).getByRole('row', { name: /PHQ-9/ })
  await expect(row).toContainText('Respondido')
  await expect(row).toContainText('5/27')
  await row.getByRole('link', { name: 'Ver resultado' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'PHQ-9' })).toBeVisible()
  await expect(
    page.getByText(
      'Resultado de instrumento de rastreio autoaplicado. Requer avaliação clínica. Não é diagnóstico.',
    ),
  ).toBeVisible()
  await expect(page.getByText('Fonte complementar.')).toBeVisible()
  await expect(page.getByRole('table', { name: 'Respostas por item' })).toContainText(
    'Pouco interesse ou pouco prazer em fazer as coisas',
  )
})

test('item 9 above zero shows the support step and raises an urgent alert', async ({ page }) => {
  const care = await linkedCare()
  await releaseQuestionnaire(care.professionalEmail, password, care.patientId, {
    variant: 'phq9',
  })

  await signIn(page, care.patientEmail)
  await startFromToday(page)
  await page.getByRole('button', { name: 'Começar' }).click()
  await answer(
    page,
    Array.from({ length: 8 }, () => 'Nenhuma vez'),
    1,
    9,
  )
  await answer(page, ['Vários dias'], 9, 9)
  await expect(page.getByRole('heading', { name: 'Obrigado por contar.' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ligar para o CVV' })).toBeVisible()
  await page.getByRole('button', { name: 'Ver o resumo' }).click()
  await expect(page.getByRole('heading', { name: 'Obrigado por responder.' })).toBeVisible()
  await expect(page.getByText('Baixo', { exact: true })).toHaveCount(0)
  await expect(page.getByText(/Algumas respostas pedem cuidado/)).toBeVisible()

  await signIn(page, care.professionalEmail)
  await expect(async () => {
    await page.goto('/pro/alerts')
    await expect(page.getByRole('row').filter({ hasText: care.patientName })).toContainText(
      'Urgente',
      { timeout: 1_000 },
    )
  }).toPass({ timeout: 30_000 })
  await expect(page.getByRole('row').filter({ hasText: 'Item 9 do PHQ-9 positivo' })).toContainText(
    care.patientName,
  )
})

test('a psychologist cannot pick the GAD-7', async ({ page }) => {
  const care = await linkedCare()
  await signIn(page, care.professionalEmail)
  const dialog = await openReleaseDialog(page, care)
  await dialog.getByRole('radio', { name: 'Ansiedade generalizada' }).check()

  await expect(dialog.getByRole('radio', { name: /^GAD-7/ })).toBeDisabled()
  await expect(
    dialog.getByText("Indisponível para psicólogos: consta como 'Não avaliado' no SATEPSI."),
  ).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Liberar', exact: true })).toBeDisabled()
})

test('the patient pauses and resumes where they stopped', async ({ page }) => {
  const care = await linkedCare()
  await releaseQuestionnaire(care.professionalEmail, password, care.patientId, {
    variant: 'phq9',
  })

  await signIn(page, care.patientEmail)
  await startFromToday(page)
  await page.getByRole('button', { name: 'Começar' }).click()
  await answer(page, ['Vários dias', 'Nenhuma vez', 'Vários dias'], 1, 9)
  await expect(page.getByText('Pergunta 4 de 9')).toBeVisible()
  await page.getByRole('link', { name: 'Pausar' }).click()
  await expect(page.getByRole('region', { name: 'Para responder' })).toContainText(
    '3 de 9 respondidas',
  )

  await page.context().clearCookies()
  await signIn(page, care.patientEmail)
  await page.goto('/today')
  await page
    .getByRole('region', { name: 'Seu profissional liberou um questionário' })
    .getByRole('link', { name: 'Continuar' })
    .click()
  await expect(page.getByText('Pergunta 4 de 9')).toBeVisible()
  await page.getByRole('button', { name: 'Voltar' }).click()
  await expect(page.getByRole('button', { name: 'Vários dias' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('a repeating questionnaire opens the next one after the answer', async ({ page }) => {
  const care = await linkedCare()
  await releaseQuestionnaire(care.professionalEmail, password, care.patientId, {
    variant: 'phq9',
    repeatEveryDays: 7,
  })

  await signIn(page, care.patientEmail)
  await startFromToday(page)
  await page.getByRole('button', { name: 'Começar' }).click()
  await answer(
    page,
    Array.from({ length: 9 }, () => 'Nenhuma vez'),
    1,
    9,
  )
  await expect(page.getByRole('heading', { name: 'Obrigado por responder.' })).toBeVisible()
  await page.goto('/today')
  await expect(
    page.getByRole('region', { name: 'Seu profissional liberou um questionário' }),
  ).toHaveCount(0)

  await signIn(page, care.professionalEmail)
  await page.goto(`/pro/patients/${care.patientId}`)
  const rows = released(page).getByRole('row', { name: /PHQ-9/ })
  await expect(rows).toHaveCount(2)
  await expect(rows.filter({ hasText: 'Respondido' })).toContainText('A cada 7 dias')
  await expect(rows.filter({ hasText: 'Liberado' })).toContainText('Disponível em')
})
