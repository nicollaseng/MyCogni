'use client'

import type { JournalNode } from '@mycogni/contracts'
import { EditorContent, useEditor } from '@tiptap/react'
import { useTranslations } from 'next-intl'
import { withImageSources } from '../document'
import { editorContentOf, journalExtensions } from './extensions'
import './journal.css'

interface JournalViewerProps {
  body: JournalNode
  imageUrls: Readonly<Record<string, string>>
}

export function JournalViewer({ body, imageUrls }: JournalViewerProps) {
  const t = useTranslations('mybook.editor')
  const editor = useEditor({
    immediatelyRender: false,
    editable: false,
    extensions: journalExtensions({
      placeholder: '',
      photo: t('photo.alt'),
      task: (text) => (text === '' ? t('emptyTask') : t('task', { text })),
    }),
    content: editorContentOf(withImageSources(body, imageUrls)),
    editorProps: { attributes: { class: 'journal' } },
  })

  return <EditorContent editor={editor} />
}
