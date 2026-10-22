import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals'
import type { JournalNode } from '@mycogni/contracts'
import { EditorContent, useEditor, type Editor, type JSONContent } from '@tiptap/react'
import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect, useRef } from 'react'
import { journalDocumentOf } from '../document'
import { renderWithIntl } from '@/test/render'
import { installVisualViewport, type FakeViewport } from '@/test/visual-viewport'
import { caretMargin } from './caret-reveal'
import { EditorToolbar } from './editor-toolbar'
import { journalExtensions } from './extensions'
import { bottomSpace, useWritingChrome } from './use-writing-chrome'

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
  const page = useRef<HTMLDivElement>(null)
  const surface = useRef<HTMLDivElement>(null)
  const chrome = useWritingChrome(editor, page, surface, true)
  useEffect(() => {
    onReady(editor)
  }, [editor, onReady])
  return (
    <div ref={page} data-testid="page" style={{ paddingBottom: bottomSpace(chrome) }}>
      <EditorToolbar
        editor={editor}
        chrome={chrome}
        surface={surface}
        wide={false}
        onPhotos={onPhotos}
        photosDisabled={false}
      />
      <EditorContent editor={editor} />
    </div>
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

function formatBar() {
  return screen.queryByRole('toolbar', { name: 'Formatação' })
}

function formatPanel() {
  return screen.queryByRole('group', { name: 'Formatar' })
}

async function openPanel() {
  await userEvent.click(screen.getByRole('button', { name: 'Formatar texto' }))
}

let viewport: FakeViewport

beforeAll(() => {
  Range.prototype.getClientRects = () => document.createElement('span').getClientRects()
  Range.prototype.getBoundingClientRect = () =>
    document.createElement('span').getBoundingClientRect()
})

beforeEach(() => {
  viewport = installVisualViewport()
  jest.spyOn(window, 'scrollBy').mockImplementation(() => undefined)
})

afterEach(() => {
  viewport.remove()
  jest.restoreAllMocks()
})

describe('EditorToolbar', () => {
  it('keeps checklist and photos on the bar and opens the formatting panel in its place', async () => {
    renderToolbar([paragraph('Olá')])

    expect(screen.getByRole('button', { name: 'Lista de tarefas' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Adicionar foto' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Negrito' })).not.toBeInTheDocument()

    await openPanel()

    expect(formatBar()).not.toBeInTheDocument()
    expect(formatPanel()).toHaveFocus()
    expect(screen.getByRole('heading', { name: 'Formatar' })).toBeInTheDocument()
    for (const name of ['Título', 'Cabeçalho', 'Subcabeçalho', 'Corpo', 'Negrito', 'Itálico']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }

    await userEvent.click(screen.getByRole('button', { name: 'Fechar formatação' }))
    expect(formatPanel()).not.toBeInTheDocument()
    expect(formatBar()).toBeInTheDocument()
  })

  it('makes the selected text bold, italic, underlined and struck through', async () => {
    const { editor } = renderToolbar([paragraph('Hoje foi bom')])
    act(() => {
      editor().commands.selectAll()
    })
    await openPanel()

    for (const name of ['Negrito', 'Itálico', 'Sublinhado', 'Tachado']) {
      await userEvent.click(screen.getByRole('button', { name }))
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'true')
    }

    const marks = firstBlock(editor())?.content?.[0]?.marks?.map((mark) => mark.type)
    expect(new Set(marks)).toEqual(new Set(['bold', 'italic', 'underline', 'strike']))
  })

  it('switches between title, heading, subheading and body', async () => {
    const { editor } = renderToolbar([paragraph('Manhã')])
    await openPanel()
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
    await openPanel()

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

    await userEvent.click(screen.getByRole('button', { name: 'Fechar formatação' }))
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
    await openPanel()
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

describe('EditorToolbar with the on-screen keyboard', () => {
  it('sits right on the keyboard while typing and hides the tab bar', () => {
    const { editor } = renderToolbar([paragraph('Olá')])
    expect(formatBar()).toHaveAttribute('data-placement', 'reading')
    expect(screen.getByTestId('page')).toHaveStyle({ paddingBottom: '128px' })

    act(() => {
      editor().view.focus()
    })
    viewport.showKeyboard(320)

    expect(formatBar()).toHaveAttribute('data-placement', 'writing')
    expect(formatBar()).toHaveStyle({ bottom: '320px', height: '48px' })
    expect(document.documentElement).toHaveAttribute('data-tab-bar', 'hidden')
    expect(screen.getByTestId('page')).toHaveStyle({ paddingBottom: `${String(48 + 320 + 24)}px` })

    viewport.hideKeyboard()

    expect(formatBar()).toHaveAttribute('data-placement', 'reading')
    expect(document.documentElement).not.toHaveAttribute('data-tab-bar')
  })

  it('ignores a keyboard opened for a field outside the page', () => {
    renderToolbar([paragraph('Olá')])
    const outside = document.createElement('textarea')
    document.body.append(outside)
    act(() => {
      outside.focus()
    })
    viewport.showKeyboard(320)

    expect(formatBar()).toHaveAttribute('data-placement', 'reading')
    expect(document.documentElement).not.toHaveAttribute('data-tab-bar')
    outside.remove()
  })

  it('formats the kept selection with the keyboard hidden and brings it back on close', async () => {
    const { editor } = renderToolbar([paragraph('Hoje foi bom')])
    act(() => {
      editor().view.focus()
      editor().commands.setTextSelection({ from: 1, to: 5 })
    })
    viewport.showKeyboard(336)

    await openPanel()
    viewport.hideKeyboard()

    expect(editor().view.dom).not.toHaveFocus()
    expect(formatPanel()).toHaveStyle({ minHeight: '336px' })
    expect(document.documentElement).toHaveAttribute('data-tab-bar', 'hidden')
    expect(screen.getByTestId('page')).toHaveStyle({ paddingBottom: `${String(336 + 24)}px` })

    await userEvent.click(screen.getByRole('button', { name: 'Negrito' }))

    expect(editor().view.dom).not.toHaveFocus()
    expect(firstBlock(editor())?.content).toEqual([
      { type: 'text', text: 'Hoje', marks: [{ type: 'bold' }] },
      { type: 'text', text: ' foi bom' },
    ])

    await userEvent.click(screen.getByRole('button', { name: 'Fechar formatação' }))

    expect(editor().view.dom).toHaveFocus()
    expect(editor().state.selection).toMatchObject({ from: 1, to: 5 })
    expect(formatPanel()).not.toBeInTheDocument()
    viewport.showKeyboard(336)
    expect(formatBar()).toHaveStyle({ bottom: '336px' })
  })

  it('uses about the height of a keyboard when none was open and closes with Escape', async () => {
    renderToolbar([paragraph('Olá')])
    await openPanel()
    expect(formatPanel()).toHaveStyle({ minHeight: '300px' })

    await userEvent.keyboard('{Escape}')

    expect(formatPanel()).not.toBeInTheDocument()
    expect(formatBar()).toBeInTheDocument()
  })

  it('scrolls the caret above the bar when typing would put it under the bar', () => {
    const { editor } = renderToolbar([paragraph('Olá')])
    act(() => {
      editor().view.focus()
    })
    viewport.showKeyboard(320)
    const bar = formatBar()
    if (bar === null) {
      throw new Error('No format bar')
    }
    jest.spyOn(bar, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 400, 390, 48))
    jest
      .spyOn(editor().view, 'coordsAtPos')
      .mockReturnValue({ left: 20, right: 21, top: 700, bottom: 730 })
    const scrollBy = jest.spyOn(window, 'scrollBy')
    scrollBy.mockClear()

    act(() => {
      editor().commands.insertContent(' e mais uma linha')
    })

    expect(scrollBy.mock.calls.at(-1)).toEqual([
      { top: 730 - (400 - caretMargin), behavior: 'instant' },
    ])
  })
})
