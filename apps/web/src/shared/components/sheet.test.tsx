import { describe, expect, it } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Sheet } from './sheet'

function Opener() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true)
        }}
      >
        Abrir
      </button>
      {open && (
        <Sheet
          title="Compartilhar com Helena"
          closeLabel="Fechar"
          onClose={() => {
            setOpen(false)
          }}
        >
          {(close) => (
            <div>
              <input aria-label="Busca" />
              <button type="button" onClick={close}>
                Concluir
              </button>
            </div>
          )}
        </Sheet>
      )}
    </>
  )
}

async function open() {
  render(<Opener />)
  await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))
  return screen.getByRole('dialog', { name: 'Compartilhar com Helena' })
}

describe('Sheet', () => {
  it('opens as a modal dialog named by its title and takes the focus', async () => {
    const dialog = await open()

    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveFocus()
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('keeps the keyboard focus inside while open', async () => {
    await open()

    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Fechar' })).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('textbox', { name: 'Busca' })).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Concluir' })).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Fechar' })).toHaveFocus()
    await userEvent.tab({ shift: true })
    expect(screen.getByRole('button', { name: 'Concluir' })).toHaveFocus()
  })

  it('closes on Escape and gives the focus back to what opened it', async () => {
    await open()

    await userEvent.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'Abrir' })).toHaveFocus()
    expect(document.body.style.overflow).toBe('')
  })

  it('closes from the close button and from the content', async () => {
    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))
    await userEvent.click(screen.getByRole('button', { name: 'Concluir' }))
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})
