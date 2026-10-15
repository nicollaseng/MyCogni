import { beforeAll, describe, expect, it, jest } from '@jest/globals'
import type { JournalNode } from '@mycogni/contracts'
import { EditorContent, useEditor, type Editor, type JSONContent } from '@tiptap/react'
import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect } from 'react'
import { journalDocumentOf } from '../document'
import { renderWithIntl } from '@/test/render'
import { EditorToolbar } from './editor-toolbar'
import { journalExtensions } from './extensions'

interface HarnessProps {
  content: JSONContent
  onReady: (editor: Editor) => void
  onPhotos: (files: File[]) => void
}

function Harness({ content, onReady, onPhotos }: HarnessProps) {
  const editor = useEditor({
    immediatelyRender: true,
    extensions: journalExtensions({
      placeholder: 'Comece a escrever…',
      photo: 'Foto',
      task: (text) => `Tarefa: ${text}`,
    }),
    content,
  })
  useEffect(() => {
    onReady(editor)
  }, [editor, onReady])
  return (
    <>
      <EditorToolbar editor={editor} onPhotos={onPhotos} photosDisabled={false} />
      <EditorContent editor={editor} />
    </>
  )
}

const paragraph = (text: string): JSONContent => ({
  type: 'paragraph',
  content: [{ type: 'text', text }],
})

function renderToolbar(content: JSONContent[]) {
  const onPhotos = jest.fn<(files: File[]) => void>()
  let current: Editor | null = null
  const result = renderWithIntl(
    <Harness
      content={{ type: 'doc', content }}
      onReady={(editor) => {
        current = editor
      }}
      onPhotos={onPhotos}
    />,
  )
  function editor(): Editor {
    if (current === null) {
      throw new Error('The editor is not ready')
    }
    return current
  }
  return { editor, onPhotos, container: result.container }
}

function documentOf(editor: Editor): JournalNode {
  const document = journalDocumentOf(editor.getJSON())
  if (document === null) {
    throw new Error('The editor holds no document')
  }
  return document
}

function firstBlock(editor: Editor): JournalNode | undefined {
  return documentOf(editor).content?.[0]
}

beforeAll(() => {
  Range.prototype.getClientRects = () => document.createElement('span').getClientRects()
  Range.prototype.getBoundingClientRect = () =>
    document.createElement('span').getBoundingClientRect()
})

describe('EditorToolbar', () => {
  it('keeps checklist and photos at hand and the rest behind the format button', async () => {
    renderToolbar([paragraph('Olá')])

    expect(screen.getByRole('button', { name: 'Lista de tarefas' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Adicionar foto' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Negrito' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Formatar texto' }))

    expect(screen.getByRole('button', { name: 'Formatar texto' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    for (const name of ['Título', 'Cabeçalho', 'Subcabeçalho', 'Corpo', 'Negrito', 'Itálico']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
  })

  it('makes the selected text bold, italic, underlined and struck through', async () => {
    const { editor } = renderToolbar([paragraph('Hoje foi bom')])
    act(() => {
      editor().commands.selectAll()
    })
    await userEvent.click(screen.getByRole('button', { name: 'Formatar texto' }))

    for (const name of ['Negrito', 'Itálico', 'Sublinhado', 'Tachado']) {
      await userEvent.click(screen.getByRole('button', { name }))
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'true')
    }

    const marks = firstBlock(editor())?.content?.[0]?.marks?.map((mark) => mark.type)
    expect(new Set(marks)).toEqual(new Set(['bold', 'italic', 'underline', 'strike']))
  })

  it('switches between title, heading, subheading and body', async () => {
    const { editor } = renderToolbar([paragraph('Manhã')])
    await userEvent.click(screen.getByRole('button', { name: 'Formatar texto' }))
    expect(screen.getByRole('button', { name: 'Corpo' })).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(screen.getByRole('button', { name: 'Título' }))
    expect(firstBlock(editor())).toMatchObject({ type: 'heading', attrs: { level: 1 } })
    expect(screen.getByRole('button', { name: 'Título' })).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(screen.getByRole('button', { name: 'Subcabeçalho' }))
    expect(firstBlock(editor())).toMatchObject({ type: 'heading', attrs: { level: 3 } })

    await userEvent.click(screen.getByRole('button', { name: 'Corpo' }))
    expect(firstBlock(editor())?.type).toBe('paragraph')
  })

  it('turns lines into bulleted, dashed, numbered and check lists', async () => {
    const { editor, container } = renderToolbar([paragraph('Dormir cedo')])
    await userEvent.click(screen.getByRole('button', { name: 'Formatar texto' }))

    await userEvent.click(screen.getByRole('button', { name: 'Lista com traços' }))
    expect(firstBlock(editor())?.type).toBe('dashList')
    expect(container.querySelector('ul[data-variant="dash"]')).toHaveTextContent('Dormir cedo')
    expect(screen.getByRole('button', { name: 'Lista com traços' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await userEvent.click(screen.getByRole('button', { name: 'Lista com marcadores' }))
    expect(firstBlock(editor())?.type).toBe('bulletList')

    await userEvent.click(screen.getByRole('button', { name: 'Lista numerada' }))
    expect(firstBlock(editor())?.type).toBe('orderedList')

    await userEvent.click(screen.getByRole('button', { name: 'Lista de tarefas' }))
    expect(firstBlock(editor())?.type).toBe('taskList')
    expect(screen.getByRole('checkbox', { name: 'Tarefa: Dormir cedo' })).not.toBeChecked()
  })

  it('indents and outdents list items', async () => {
    const { editor } = renderToolbar([
      {
        type: 'bulletList',
        content: [
          { type: 'listItem', content: [paragraph('Primeiro')] },
          { type: 'listItem', content: [paragraph('Segundo')] },
        ],
      },
    ])
    await userEvent.click(screen.getByRole('button', { name: 'Formatar texto' }))
    act(() => {
      editor().commands.setTextSelection(3)
    })
    expect(screen.getByRole('button', { name: 'Aumentar recuo' })).toBeDisabled()

    act(() => {
      editor().commands.setTextSelection(16)
    })
    await userEvent.click(screen.getByRole('button', { name: 'Aumentar recuo' }))

    const list = () => editor().state.doc.firstChild
    expect(list()?.childCount).toBe(1)
    expect(list()?.firstChild?.lastChild?.type.name).toBe('bulletList')

    await userEvent.click(screen.getByRole('button', { name: 'Diminuir recuo' }))
    expect(list()?.childCount).toBe(2)
  })

  it('hands the chosen photos to the page', async () => {
    const { onPhotos, container } = renderToolbar([paragraph('Praia')])
    const input = container.querySelector('input[type="file"]')
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('No file input')
    }
    expect(input).toHaveAttribute('accept', 'image/*')

    const photo = new File(['praia'], 'praia.png', { type: 'image/png' })
    await userEvent.upload(input, photo)

    expect(onPhotos).toHaveBeenCalledWith([photo])
  })
})
